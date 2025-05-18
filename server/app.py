# server/app.py (ИСПРАВЛЕННАЯ ВЕРСИЯ)

import os
import pickle
from flask import Flask, request, jsonify, abort
from sqlalchemy import or_ # <--- ДОБАВЛЕН ИМПОРТ
from flask_migrate import Migrate
from extensions import db, jwt, Migrate # Удален дублирующийся Migrate
from flask_jwt_extended import (
    JWTManager, create_access_token, # JWTManager не используется, можно удалить?
    jwt_required, get_jwt_identity
)
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from surprise import dump # dump не используется, можно удалить?
from models.models import User, Movie, Rating, MovieList, ListMovie, Genre # та інші потрібні моделі
from decorators import role_required
import joblib
# import scipy # scipy не используется напрямую, можно удалить?
import scipy.sparse as sp
# ── Init Flask ─────────────────────────────────────────────────────
app = Flask(__name__)
from config import Config
app.config.from_object(Config)

db.init_app(app)
jwt.init_app(app)
migrate = Migrate(app, db)
CORS(app)

# ── Load ML models ─────────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
id_to_idx = joblib.load(os.path.join(MODELS_DIR, 'movie_id_to_index.pkl'))
idx_to_id = joblib.load(os.path.join(MODELS_DIR, 'index_to_movie_id.pkl'))
knn_model = joblib.load(os.path.join(MODELS_DIR, 'knn_model.pkl'))
svd_model = joblib.load(os.path.join(MODELS_DIR, 'svd_model.pkl'))
content_nn = joblib.load(os.path.join(MODELS_DIR, 'content_nn.pkl'))
content_features = sp.load_npz(os.path.join(MODELS_DIR, 'content_features.npz'))

trainset = knn_model.trainset
# _raw2inner = getattr(trainset, '_raw2inner_id_items', None) or trainset._raw2inner_id_items # _raw2inner не используется, можно удалить?
VALID_IDS = set(int(rid) for rid in trainset._raw2inner_id_items.keys())
# ── Recommendation helpers ─────────────────────────────────────────
def knn_recommend(movie_id: int, n: int):
    """
    Surprise.KNNBasic: берём соседей через get_neighbors и sim.
    """
    trainset = knn_model.trainset
    raw_iid = movie_id
    try:
        inner_id = trainset.to_inner_iid(raw_iid)
    except ValueError:
        return []
    # получаем соседей
    nbrs = knn_model.get_neighbors(inner_id, k=n)
    recs = []
    for nbr_inner_id in nbrs:
        raw_id = trainset.to_raw_iid(nbr_inner_id)
           # sim — это ndarray, поэтому берём напрямую элемент [inner_id][nbr_inner_id]
        score = float(knn_model.sim[inner_id][nbr_inner_id])
        # отбрасываем соседей с нулевой или отрицательной похожестью
        if score <= 0:
            continue
        recs.append({"movieId": int(raw_id), "score": score})
    return recs

def svd_recommend(movie_id: int, n: int):
    """
    Surprise.SVD: косинусная близость между qi-факторами.
    """
    import numpy as np
    trainset = svd_model.trainset
    raw_iid  = movie_id
    try:
        inner_id = trainset.to_inner_iid(raw_iid)
    except ValueError:
        return []
    # получаем матрицу item-факторов
    all_q = getattr(svd_model, 'qi', getattr(svd_model, 'qi_', None))
    if all_q is None:
        return []
    v = all_q[inner_id]
    norms = np.linalg.norm(all_q, axis=1) * np.linalg.norm(v)
    # Добавим проверку на ноль в знаменателе
    valid_norms = norms > 1e-6 # Маленькое число для предотвращения деления на ноль
    sims = np.zeros_like(norms)
    sims[valid_norms] = (all_q[valid_norms] @ v) / norms[valid_norms]

    # топ-(n+1) индексов
    top = np.argsort(-sims)[:n+1]
    recs = []
    for idx in top:
        if idx == inner_id:
            continue
        raw_id = trainset.to_raw_iid(idx)
        recs.append({"movieId": int(raw_id), "score": float(sims[idx])})
        if len(recs) >= n:
            break
    return recs

# ── 1) Гибридный рекоммендер ───────────────────────────────────────────

# вверху файла
W_KNN     = 0.2
W_CONTENT = 0.4
W_SVD     = 0.4  # теперь сумма = 1.0

def hybrid_recommend(movie_id: int, n: int) -> list[dict]:
    # считаем, сколько есть рейтингов, чтобы отключить KNN при малом числе
    rating_count = Rating.query.filter_by(movie_id=movie_id).count()
    recs_knn     = knn_recommend(movie_id, n*2)     if rating_count >= 5 else []
    recs_content = content_recommend(movie_id, n*2)
    recs_svd     = svd_recommend(movie_id, n*2)

    # вспомогательная нормализация в [0,1]
    def normalize(recs):
        if not recs:
            return {}
        scores = [r['score'] for r in recs]
        lo, hi = min(scores), max(scores)
        denom = hi - lo if hi != lo else 1.0
        # Добавим проверку denom != 0
        if denom == 0:
             return {r['movieId']: 0.0 for r in recs} # Все оценки одинаковы, нормализуем к 0
        return {r['movieId']: (r['score'] - lo) / denom for r in recs}

    norm_knn     = normalize(recs_knn)
    norm_content = normalize(recs_content)
    norm_svd     = normalize(recs_svd)

    # смешиваем
    combined = {}
    all_movie_ids = set(norm_knn.keys()) | set(norm_content.keys()) | set(norm_svd.keys())

    for mid in all_movie_ids:
         score = (norm_knn.get(mid, 0) * W_KNN +
                  norm_content.get(mid, 0) * W_CONTENT +
                  norm_svd.get(mid, 0) * W_SVD)
         combined[mid] = score


    # если ничего не дали
    if not combined:
        top_movies = Movie.query.order_by(Movie.popularity.desc()).limit(n).all()
        # ИСПРАВЛЕНО: Использовать title_uk/title_en
        return [
            {"movieId": m.movie_id, "title": m.title_uk if m.title_uk else m.title_en, "score": 0.0}
            for m in top_movies
        ]

    # сортируем и берём первые n
    top = sorted(combined.items(), key=lambda x: -x[1])[:n]
    out = []
    for mid, sc in top:
        m = Movie.query.get(mid)
        if m:
            # ИСПРАВЛЕНО: Использовать title_uk/title_en
            out.append({"movieId": mid, "title": m.title_uk if m.title_uk else m.title_en, "score": round(sc, 3)})
    return out



def content_recommend(movie_id: int, n: int):
    """
    Контентные рекомендации по косинусному сходству.
    """
    # Маппинг movieId → индекс в content_features
    idx = id_to_idx.get(movie_id)
    if idx is None:
        return []

    # Берём n+1 сосед (первый — это сам фильм)
    try:
        # Добавим проверку на случай, если n+1 больше числа элементов
        k = min(n + 1, content_features.shape[0])
        dists, neighs = content_nn.kneighbors(
            content_features[idx], n_neighbors=k
        )
    except IndexError:
        # Если idx выходит за пределы, вернуть пустой список
        return []


    recs = []
    for dist, neigh_idx in zip(dists[0][1:], neighs[0][1:]):
        # Добавим проверку индекса соседа
        if neigh_idx >= len(idx_to_id):
             continue
        raw_id = idx_to_id[neigh_idx]
        # cosine distance → similarity
        score = round(1 - float(dist), 3)
        recs.append({"movieId": raw_id, "score": score})
    return recs



# svd_fallback не используется, можно удалить?
# def svd_fallback(n:int):
#     # допустим user_id=1 (или средний user), или можно брать весь VALID_IDS
#     preds = [(mid, svd_model.predict(1, mid).est) for mid in VALID_IDS]
#     top = sorted(preds, key=lambda x: -x[1])[:n]
#     return [{"movieId": mid, "score": score} for mid, score in top]

# ── Auth endpoints ──────────────────────────────────────────────────
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
         abort(400, description="Missing required fields: email, password, name")

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email вже зайнятий"}), 400

    # Хэшируем пароль и сохраняем в поле `password`
    hashed = generate_password_hash(data['password'])
    user = User(
        name=data['name'],
        email=data['email'],
        password=hashed
    )

    db.session.add(user)
    db.session.commit()
    # Создаем список "favorites" для нового пользователя
    try:
         get_or_create_fav_list(str(user.id)) # Передаем ID как строку, как ожидает get_jwt_identity
    except Exception as e:
         app.logger.error(f"Failed to create favorites list for user {user.id}: {e}")
         # Не прерываем регистрацию, но логируем ошибку

    return jsonify({"message": "Реєстрація успішна"}), 201


@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    if not data or not data.get('email') or not data.get('password'):
        abort(400, description="Missing email or password")

    user = User.query.filter_by(email=data['email']).first()

    # проверяем именно поле `password`
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({"message": "Невірний логін або пароль"}), 401

    # Возвращаем ID как строку, как при регистрации
    token = create_access_token(identity=str(user.id))
    return jsonify({
        'access_token': token,
        'user': {'id': user.id, 'name': user.name, 'email': user.email}
    }), 200


@app.route('/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity() # Возвращает строку
    user = User.query.get(int(current_user_id)) # Преобразуем в int для запроса

    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email
    }), 200

# ── Ratings endpoints ────────────────────────────────────────────────
@app.route('/api/ratings', methods=['POST'])
@jwt_required()
def create_rating():
    user_id_str = get_jwt_identity()
    data = request.get_json() or {}
    if not data or 'movieId' not in data or 'score' not in data:
         abort(400, description="Missing movieId or score in request")

    try:
        user_id = int(user_id_str)
        movie_id = int(data['movieId'])
        score = float(data['score'])
        # Добавим валидацию оценки
        if not (0.5 <= score <= 5.0):
             abort(400, description="Score must be between 0.5 and 5.0")
    except (ValueError, TypeError) as e:
        abort(400, description=f"Invalid input type: {e}")


    # Проверяем существует ли фильм
    movie_exists = db.session.query(Movie.movie_id).filter_by(movie_id=movie_id).first() is not None
    if not movie_exists:
        abort(404, description=f"Movie with id {movie_id} not found")

    # Ищем существующий рейтинг или создаем новый
    existing_rating = Rating.query.filter_by(user_id=user_id, movie_id=movie_id).first()

    if existing_rating:
        # Обновляем существующий
        existing_rating.rating = score # ИСПРАВЛЕНО: Используем .rating
        existing_rating.created_at = datetime.utcnow() # Обновляем время
    else:
        # Создаем новый
        # ИСПРАВЛЕНО: Используем .rating
        r = Rating(user_id=user_id, movie_id=movie_id, rating=score)
        db.session.add(r)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Database error on rating: {e}")
        abort(500, description="Database error, could not save rating.")

    # ИСПРАВЛЕНО: Возвращаем .rating в ключе 'score'
    return jsonify({'message':'ok', 'movieId': movie_id, 'score': score}), 201


@app.route('/api/ratings/<int:user_id_param>', methods=['GET'])
@jwt_required()
def get_ratings(user_id_param):
    # Получаем ID текущего пользователя из токена
    current_user_id_str = get_jwt_identity()
    current_user_id = int(current_user_id_str)

    # Проверяем, запрашивает ли пользователь свои собственные рейтинги
    if current_user_id != user_id_param:
        # Можно вернуть 403 Forbidden или 404 Not Found
        abort(403, description="You can only view your own ratings.")

    ratings = Rating.query.filter_by(user_id=current_user_id).all()
    # ИСПРАВЛЕНО: Возвращаем .rating в ключе 'score'
    return jsonify([{'movieId': r.movie_id, 'score': r.rating} for r in ratings]), 200


# ── Favorites endpoints ─────────────────────────────────────────────
def get_or_create_fav_list(user_id_str):
    # ИСПРАВЛЕНО: Используем MovieList
    # ИСПРАВЛЕНО: Преобразуем user_id_str в int
    user_id = int(user_id_str)
    fav_list = MovieList.query.filter_by(user_id=user_id, name='favorites').first()
    if not fav_list:
        # ИСПРАВЛЕНО: Используем MovieList
        fav_list = MovieList(name='favorites', user_id=user_id)
        try:
            db.session.add(fav_list)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Failed to create favorites list for user {user_id}: {e}")
            # Можно пробросить ошибку или вернуть None, чтобы обработать в вызывающей функции
            raise e # Пробрасываем ошибку дальше
    return fav_list

@app.route('/api/recommend/user/favorites', methods=['GET','POST','DELETE'])
@jwt_required()
def user_favorites():
    # print("→ Headers:", dict(request.headers)) # Убираем или оставляем для отладки
    user_id_str = get_jwt_identity()
    try:
        fav_list = get_or_create_fav_list(user_id_str)
    except Exception:
         abort(500, description="Could not get or create favorites list.")

    if request.method == 'GET':
        movies = []
        # ИСПРАВЛЕНО: Используем fav_list.list_movies
        for lm in fav_list.list_movies:
            m = Movie.query.get(lm.movie_id)
            if m:
                # ИСПРАВЛЕНО: Использовать title_uk/title_en
                movies.append({'movieId': m.movie_id, 'title': m.title_uk if m.title_uk else m.title_en})
        return jsonify(movies), 200

    # --- Блок для POST и DELETE ---
    data = request.get_json() or {}
    movie_id_str = data.get('movieId')

    if not movie_id_str:
         abort(400, description="Missing 'movieId' in request data")

    try:
        movie_id = int(movie_id_str)
    except (ValueError, TypeError):
        abort(400, description="Invalid 'movieId' format")

    # Проверяем, существует ли фильм
    movie_exists = db.session.query(Movie.movie_id).filter_by(movie_id=movie_id).first() is not None
    if not movie_exists:
        abort(404, description=f"Movie with id {movie_id} not found")

    if request.method == 'POST':
        # Проверяем, существует ли уже запись
        # ИСПРАВЛЕНО: Используем fav_list.list_movies
        exists = any(lm.movie_id == movie_id for lm in fav_list.list_movies)
        if not exists:
            lm = ListMovie(list_id=fav_list.id, movie_id=movie_id)
            db.session.add(lm)
            db.session.commit() # Commit здесь, чтобы слушатель сработал
        return jsonify({'message':'added'}), 201

    elif request.method == 'DELETE':
        lm = ListMovie.query.filter_by(list_id=fav_list.id, movie_id=movie_id).first()
        if lm:
            db.session.delete(lm)
            db.session.commit() # Commit здесь, чтобы слушатель сработал
        # Возвращаем 200, даже если нечего было удалять (идемпотентность)
        return jsonify({'message':'deleted'}), 200

    # Если метод не GET, POST или DELETE (на всякий случай)
    abort(405) # Method Not Allowed

# ── Movie-based recommendations ─────────────────────────────────────
@app.route('/api/recommend/movie/<int:movie_id>', methods=['GET'])
def recommend_by_movie(movie_id):
    """
    Использует path-параметр movie_id, а не JSON.
    ?n= сколько вернуть
    ?alg= knn или svd или content или hybrid
    """
    try:
        n = int(request.args.get('n', 10)) # Увеличил дефолтное значение
    except ValueError:
        n = 10
    alg = request.args.get('alg', 'hybrid').lower() # По умолчанию гибрид

    # Получаем "сырые" рекомендации
    raw = []
    if alg == 'knn':
        raw = knn_recommend(movie_id, n)
    elif alg == 'content':
        raw = content_recommend(movie_id, n)
    elif alg == 'hybrid':
       raw = hybrid_recommend(movie_id, n)
    elif alg == 'svd':
       raw = svd_recommend(movie_id, n)
    else:
        # Если алгоритм не распознан, можно вернуть ошибку или использовать дефолтный
        # Используем гибрид по умолчанию
        raw = hybrid_recommend(movie_id, n)


    if not raw:
        # Если нет рекомендаций, возвращаем топ популярных, исключая текущий фильм
        top_movies = Movie.query.filter(Movie.movie_id != movie_id)\
                              .order_by(Movie.popularity.desc())\
                              .limit(n).all()
        # Код ответа может быть 200, но с информацией об отсутствии рек.
        # ИСПРАВЛЕНО: title
        raw = [{'movieId': m.movie_id, 'title': m.title_uk if m.title_uk else m.title_en, 'score': 0} for m in top_movies]
        # Можно добавить флаг, что это фолбэк
        # return jsonify({'recommendations': raw, 'fallback': True}), 200
        # Пока просто вернем список
        # return jsonify(raw), 200 # Вернем ниже вместе с остальными

    out = []
    processed_ids = set() # Для удаления дубликатов, если вдруг появятся
    for r in raw:
        movie_id_rec = r['movieId']
        if movie_id_rec == movie_id or movie_id_rec in processed_ids: # Исключаем исходный фильм и дубликаты
            continue

        m = Movie.query.get(movie_id_rec) # Используем get для скорости
        if m:
            genre_names = [genre.name_uk if genre.name_uk else genre.name_en for genre in m.genres]
            out.append({
                'movieId': m.movie_id,
                'title': m.title_uk if m.title_uk else m.title_en,
                'score': round(r.get('score', 0), 3), # Используем get для score
                'genres': "|".join(genre_names)
            })
            processed_ids.add(movie_id_rec)
            if len(out) >= n: # Убедимся, что вернули не больше n
                 break

    return jsonify(out), 200

@app.route('/api/movies/search')
def search_local_movies():
    q = request.args.get('q','').strip()
    if not q:
        return jsonify([]), 200

    results = Movie.query \
        .filter(
            or_(Movie.title_en.ilike(f'%{q}%'), Movie.title_uk.ilike(f'%{q}%')),
            Movie.movie_id.in_(VALID_IDS)
        ) \
        .order_by(Movie.title_en) \
        .limit(10) \
        .all()
    # ИСПРАВЛЕНО: title
    return jsonify([{'movieId': m.movie_id, 'title': m.title_uk if m.title_uk else m.title_en} for m in results]), 200
# -------------------------
# Додавання фільму — доступно тільки content_manager та admin
@app.route('/api/movies', methods=['POST'])
@jwt_required()
@role_required('content_manager', 'admin')
def create_movie():
    data = request.get_json()
    # TODO: створення фільму з data
    фільм = Movie(**data)
    db.session.add(фільм)
    db.session.commit()
    return jsonify({'msg': 'Фільм створено'}), 201

# Оновлення фільму — доступно тільки content_manager та admin
@app.route('/api/movies/<int:movie_id>', methods=['PUT'])
@jwt_required()
@role_required('content_manager', 'admin')
def update_movie(movie_id):
    фільм = Movie.query.get_or_404(movie_id)
    data = request.get_json()
    for поле, значення in data.items():
        setattr(фільм, поле, значення)
    db.session.commit()
    return jsonify({'msg': 'Фільм оновлено'}), 200

# Видалення фільму — доступно тільки content_manager та admin
@app.route('/api/movies/<int:movie_id>', methods=['DELETE'])
@jwt_required()
@role_required('content_manager', 'admin')
def delete_movie(movie_id):
    фільм = Movie.query.get_or_404(movie_id)
    db.session.delete(фільм)
    db.session.commit()
    return jsonify({'msg': 'Фільм видалено'}), 200

# -------------------------
# Зміна ролі користувача — доступно тільки admin
@app.route('/api/users/<int:user_id>/role', methods=['PATCH'])
@jwt_required()
@role_required('admin')
def change_user_role(user_id):
    data = request.get_json()
    нова_роль = data.get('role')
    if нова_роль not in ('user', 'content_manager', 'admin'):
        return jsonify({'msg': 'Невірна роль'}), 400

    user = User.query.get_or_404(user_id)
    user.role = нова_роль
    db.session.commit()
    return jsonify({'msg': f'Роль змінено на {нова_роль}'}), 200

# ── Update & Delete endpoints for ratings ────────────────────────────
@app.route('/api/ratings/<int:movie_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def modify_rating(movie_id):
    user_id_str = get_jwt_identity()
    user_id = int(user_id_str)

    # Проверяем существование фильма
    movie_exists = db.session.query(Movie.movie_id).filter_by(movie_id=movie_id).first() is not None
    if not movie_exists:
        abort(404, description=f"Movie with id {movie_id} not found")

    # находимо існуючий рейтинг
    rating = Rating.query.filter_by(user_id=user_id, movie_id=movie_id).first()

    if request.method == 'PUT':
        if not rating:
            abort(404, description="Rating not found, cannot update")

        data = request.get_json() or {}
        if 'score' not in data:
            abort(400, description="Missing 'score' in request")
        try:
            score = float(data['score'])
            if not (0.5 <= score <= 5.0):
                abort(400, description="Score must be between 0.5 and 5.0")
        except (ValueError, TypeError):
             abort(400, description="Invalid score format")

        # ИСПРАВЛЕНО: Используем .rating
        rating.rating = score
        rating.created_at = datetime.utcnow() # Обновляем время изменения

        db.session.commit()
        # ИСПРАВЛЕНО: Возвращаем .rating в ключе 'score'
        return jsonify({'message': 'Rating updated', 'movieId': movie_id, 'score': rating.rating}), 200

    else:  # DELETE
        if not rating:
             # Если рейтинга нет, удаление уже выполнено (идемпотентность)
             return jsonify({'message': 'Rating already deleted or never existed', 'movieId': movie_id}), 200

        db.session.delete(rating)
        db.session.commit()
        return jsonify({'message': 'Rating deleted', 'movieId': movie_id}), 200

# --- Эндпоинты для управления списками фильмов ---

# Получить все списки пользователя (кроме "favorites")
@app.route('/api/lists', methods=['GET'])
@jwt_required()
def get_user_lists():
    user_id_str = get_jwt_identity()
    user_id = int(user_id_str)
    # ИСПРАВЛЕНО: Используем MovieList
    lists = MovieList.query.filter_by(user_id=user_id).filter(MovieList.name != 'favorites').all()
    output = [{'id': lst.id, 'name': lst.name, 'is_public': lst.is_public} for lst in lists]
    return jsonify(output), 200

# Создать новый список
@app.route('/api/lists', methods=['POST'])
@jwt_required()
def create_list():
    user_id_str = get_jwt_identity()
    user_id = int(user_id_str)
    data = request.get_json() or {}

    if not data or not data.get('name'):
        abort(400, description="Необхідно вказати ім'я списку ('name')")

    list_name = data['name'].strip()
    if not list_name:
         abort(400, description="Ім'я списку не може бути порожнім")

    if list_name.lower() == 'favorites':
         abort(400, description="Список 'favorites' зарезервовано")

    # ИСПРАВЛЕНО: Используем MovieList
    existing_list = MovieList.query.filter_by(user_id=user_id, name=list_name).first()
    if existing_list:
        abort(409, description=f"Список з ім'ям '{list_name}' вже існує")

    # ИСПРАВЛЕНО: Используем MovieList
    new_list = MovieList(user_id=user_id, name=list_name)
    db.session.add(new_list)
    db.session.commit()

    return jsonify({'id': new_list.id, 'name': new_list.name, 'message': 'Список створено'}), 201

# Удалить список
@app.route('/api/lists/<int:list_id>', methods=['DELETE'])
@jwt_required()
def delete_list(list_id):
    user_id_str = get_jwt_identity()
    user_id = int(user_id_str)
    # ИСПРАВЛЕНО: Используем MovieList
    list_to_delete = MovieList.query.filter_by(id=list_id, user_id=user_id).first()

    if not list_to_delete:
        abort(404, description="Список не знайдено або у вас немає прав на його видалення")

    if list_to_delete.name.lower() == 'favorites':
         abort(403, description="Список 'favorites' не можна видалити")

    db.session.delete(list_to_delete)
    db.session.commit()

    return jsonify({'message': f"Список '{list_to_delete.name}' видалено"}), 200


# Переименовать список
@app.route('/api/lists/<int:list_id>', methods=['PUT'])
@jwt_required()
def rename_list(list_id):
    user_id_str = get_jwt_identity()
    user_id = int(user_id_str)
    data = request.get_json() or {}

    if not data or not data.get('name'):
        abort(400, description="Необхідно вказати нове ім'я списку ('name')")

    new_name = data['name'].strip()
    if not new_name:
         abort(400, description="Нове ім'я списку не може бути порожнім")

    if new_name.lower() == 'favorites':
         abort(400, description="Ім'я 'favorites' зарезервовано")

    # ИСПРАВЛЕНО: Используем MovieList
    list_to_rename = MovieList.query.filter_by(id=list_id, user_id=user_id).first()

    if not list_to_rename:
        abort(404, description="Список не знайдено або у вас немає прав")

    if list_to_rename.name.lower() == 'favorites':
         abort(403, description="Список 'favorites' не можна перейменовувати")

    # ИСПРАВЛЕНО: Используем MovieList
    existing_list = MovieList.query.filter(
        MovieList.user_id == user_id,
        MovieList.name == new_name,
        MovieList.id != list_id
    ).first()
    if existing_list:
        abort(409, description=f"Список з ім'ям '{new_name}' вже існує")

    list_to_rename.name = new_name
    db.session.commit()

    return jsonify({'id': list_to_rename.id, 'name': list_to_rename.name, 'message': 'Список перейменовано'}), 200


# Получить детали конкретного списка (включая фильмы)
@app.route('/api/lists/<int:list_id>', methods=['GET'])
@jwt_required(optional=True)
def get_list_details(list_id):
    current_user_id_str = get_jwt_identity()
    # ИСПРАВЛЕНО: Используем MovieList
    target_list = MovieList.query.get_or_404(list_id)

    is_owner = False
    if current_user_id_str:
         is_owner = str(target_list.user_id) == current_user_id_str

    if not is_owner and not target_list.is_public:
        abort(404, description="Список не знайдено або він є приватним")

    if target_list.name.lower() == 'favorites' and not is_owner:
         abort(404, description="Список 'favorites' є приватним")

    movies_in_list = []
    # ИСПРАВЛЕНО: Используем target_list.list_movies
    # Добавим .options(joinedload(ListMovie.movie)) для оптимизации
    from sqlalchemy.orm import joinedload
    list_movie_entries = target_list.list_movies.options(joinedload(ListMovie.movie)).all()

    for list_movie_entry in list_movie_entries:
        movie = list_movie_entry.movie # Получаем фильм из загруженной связи
        if movie:
            # ИСПРАВЛЕНО: Использовать title_uk/title_en
            movies_in_list.append({
                'movieId': movie.movie_id,
                'title': movie.title_uk if movie.title_uk else movie.title_en
            })

    return jsonify({
        'id': target_list.id,
        'name': target_list.name,
        'is_public': target_list.is_public,
        'movies': movies_in_list,
        'owner_name': target_list.owner.name if target_list.owner else None # Добавим имя владельца
    }), 200


@app.route('/api/lists/<int:list_id>/share', methods=['PUT'])
@jwt_required()
def toggle_list_public_status(list_id):
    user_id_str = get_jwt_identity()
    user_id = int(user_id_str)

    # ИСПРАВЛЕНО: Используем MovieList
    list_to_toggle = MovieList.query.filter_by(id=list_id, user_id=user_id).first()

    if not list_to_toggle:
        abort(404, description="Список не знайдено або у вас немає прав")

    if list_to_toggle.name.lower() == 'favorites':
        abort(403, description="Список 'favorites' не може бути публічним")

    list_to_toggle.is_public = not list_to_toggle.is_public
    db.session.commit()

    new_status = "публічним" if list_to_toggle.is_public else "приватним"
    return jsonify({
        'message': f"Статус списку '{list_to_toggle.name}' змінено на '{new_status}'.",
        'id': list_to_toggle.id,
        'name': list_to_toggle.name,
        'is_public': list_to_toggle.is_public
        }), 200

# Эндпоинт для получения рекомендаций на основе списка
@app.route('/api/recommend/list/<int:list_id>', methods=['GET'])
@jwt_required(optional=True) # Разрешаем и анонимам, если список публичный
def recommend_by_list(list_id):
    current_user_id_str = get_jwt_identity()

    try:
        n = int(request.args.get('n', 10))
    except ValueError:
        n = 10
    num_candidates_multiplier = 3

    # 1. Находим список
    # ИСПРАВЛЕНО: Используем MovieList
    target_list = MovieList.query.get(list_id)
    if not target_list:
        abort(404, description="Список не знайдено")

    # Проверка доступа
    is_owner = False
    if current_user_id_str:
         is_owner = str(target_list.user_id) == current_user_id_str

    if not is_owner and not target_list.is_public:
        abort(404, description="Цей список є приватним")

    # 2. Получаем ID фильмов
    # ИСПРАВЛЕНО: Используем target_list.list_movies
    # Оптимизация: получаем только movie_id
    movie_ids_in_list = [lm.movie_id for lm in target_list.list_movies]

    if not movie_ids_in_list:
        return jsonify([]), 200

    # 3. Агрегируем рекомендации
    aggregated_recs = {}
    num_to_fetch_per_movie = n * num_candidates_multiplier

    # print(f"Generating recommendations based on list {list_id} ({target_list.name}) with {len(movie_ids_in_list)} movies.")

    for movie_id in movie_ids_in_list:
        individual_recs = hybrid_recommend(movie_id, num_to_fetch_per_movie)
        for rec in individual_recs:
            rec_movie_id = rec['movieId']
            score = rec.get('score', 0)
            aggregated_recs[rec_movie_id] = aggregated_recs.get(rec_movie_id, 0) + score

    # 4. Фильтруем фильмы из исходного списка
    filtered_recs = {mid: score for mid, score in aggregated_recs.items() if mid not in movie_ids_in_list}

    # 5. Сортируем и берем топ N
    sorted_recs = sorted(filtered_recs.items(), key=lambda item: item[1], reverse=True)[:n]

    # 6. Формируем ответ
    output = []
    # Оптимизация: Получаем все нужные фильмы одним запросом
    movie_ids_to_fetch = [mid for mid, score in sorted_recs]
    movies_dict = {m.movie_id: m for m in Movie.query.filter(Movie.movie_id.in_(movie_ids_to_fetch)).all()}

    for movie_id, score in sorted_recs:
        movie = movies_dict.get(movie_id)
        if movie:
            # ИСПРАВЛЕНО: Использовать title_uk/title_en
            output.append({
                'movieId': movie.movie_id,
                'title': movie.title_uk if movie.title_uk else movie.title_en,
                'score': round(score, 3)
            })

    # print(f"Returning {len(output)} recommendations for list {list_id}.")
    return jsonify(output), 200


# Добавить фильм в конкретный список
@app.route('/api/lists/<int:list_id>/movies', methods=['POST'])
@jwt_required()
def add_movie_to_list(list_id):
    user_id_str = get_jwt_identity()
    user_id = int(user_id_str)
    data = request.get_json() or {}

    if not data or 'movieId' not in data:
        abort(400, description="Необхідно вказати ID фільму ('movieId')")

    try:
        movie_id = int(data['movieId'])
    except (ValueError, TypeError):
         abort(400, description="Невірний формат movieId")

    # ИСПРАВЛЕНО: Используем MovieList
    target_list = MovieList.query.filter_by(id=list_id, user_id=user_id).first()
    if not target_list:
        abort(404, description="Список не знайдено або у вас немає прав")

    if target_list.name.lower() == 'favorites':
        abort(403, description="Для додавання в 'Улюблені' використовуйте /api/recommend/user/favorites")

    movie = Movie.query.get(movie_id)
    if not movie:
        abort(404, description="Фільм з таким ID не знайдено в базі даних")

    exists = ListMovie.query.filter_by(list_id=list_id, movie_id=movie_id).first()
    if exists:
        return jsonify({'message': 'Фільм вже є у цьому списку'}), 200

    new_link = ListMovie(list_id=list_id, movie_id=movie_id)
    db.session.add(new_link)
    db.session.commit() # Commit для срабатывания слушателя

    # ИСПРАВЛЕНО: Использовать title_uk/title_en
    movie_title = movie.title_uk if movie.title_uk else movie.title_en
    return jsonify({'message': f"Фільм '{movie_title}' додано до списку '{target_list.name}'"}), 201


# Удалить фильм из конкретного списка
@app.route('/api/lists/<int:list_id>/movies/<int:movie_id>', methods=['DELETE'])
@jwt_required()
def remove_movie_from_list(list_id, movie_id):
    user_id_str = get_jwt_identity()
    user_id = int(user_id_str)

    # ИСПРАВЛЕНО: Используем MovieList
    target_list = MovieList.query.filter_by(id=list_id, user_id=user_id).first()
    if not target_list:
        abort(404, description="Список не знайдено або у вас немає прав")

    if target_list.name.lower() == 'favorites':
        abort(403, description="Для видалення з 'Улюблених' використовуйте /api/recommend/user/favorites")

    link_to_delete = ListMovie.query.filter_by(list_id=list_id, movie_id=movie_id).first()

    if not link_to_delete:
        # Идемпотентность: если уже удалено, возвращаем успех
        return jsonify({'message': f"Фільм (ID: {movie_id}) вже видалено зі списку '{target_list.name}' або його там не було"}), 200

    db.session.delete(link_to_delete)
    db.session.commit() # Commit для срабатывания слушателя

    return jsonify({'message': f"Фільм (ID: {movie_id}) видалено зі списку '{target_list.name}'"}), 200


# ── Run ─────────────────────────────────────────────────────────────
if __name__ == '__main__':
    # Добавим создание таблиц в контексте приложения, если они не существуют
    with app.app_context():
        db.create_all()
        # Опционально: можно добавить сюда логику для начального заполнения ролей, если нужно
        # if Role.query.count() == 0:
        #     print("Adding default roles...")
        #     db.session.add_all([Role(name='admin'), Role(name='user')])
        #     db.session.commit()

    app.run(debug=True, host='0.0.0.0', port=5000)