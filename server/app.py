# server/app.py

import os
import pickle
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# ── Init Flask ─────────────────────────────────────────────────────
app = Flask(__name__)
from config import Config
app.config.from_object(Config)

db  = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

# ── SQLAlchemy Models ─────────────────────────────────────────────
from models.user       import User
from models.movie      import Movie
from models.rating     import Rating
from models.user_list  import List, ListMovie

# ── Load ML models ─────────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
with open(os.path.join(MODELS_DIR, 'movie_id_map.pkl'), 'rb') as f:
    movie_map = pickle.load(f)
with open(os.path.join(MODELS_DIR, 'knn_model.pkl'), 'rb') as f:
    knn_model = pickle.load(f)
with open(os.path.join(MODELS_DIR, 'svd_model.pkl'), 'rb') as f:
    svd_model = pickle.load(f)


# ── Recommendation helpers ─────────────────────────────────────────
def knn_recommend(movie_id: int, n: int):
    """
    Surprise.KNNBasic: берём соседей через get_neighbors и sim.
    """
    trainset = knn_model.trainset
    raw_iid  = str(movie_id)
    try:
        inner_id = trainset.to_inner_iid(raw_iid)
    except ValueError:
        return []
    # получаем соседей
    nbrs = knn_model.get_neighbors(inner_id, k=n)
    recs = []
    for nbr_inner_id in nbrs:
        raw_id = trainset.to_raw_iid(nbr_inner_id)
        score  = knn_model.sim[inner_id].get(nbr_inner_id, 0)
        recs.append({"movieId": int(raw_id), "score": float(score)})
    return recs

def svd_recommend(movie_id: int, n: int):
    """
    Surprise.SVD: косинусная близость между qi-факторами.
    """
    import numpy as np
    trainset = svd_model.trainset
    raw_iid  = str(movie_id)
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
    sims  = (all_q @ v) / norms
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

# ── Auth endpoints ──────────────────────────────────────────────────
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message":"Email вже зайнятий"}), 400
    user = User(
        name=data['name'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message":"Реєстрація успішна"}), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({"message":"Невірний логін або пароль"}), 401
    token = create_access_token(identity=user.id)
    return jsonify({
        'access_token': token,
        'user': {'id': user.id, 'name': user.name, 'email': user.email}
    }), 200


# ── Ratings endpoints ────────────────────────────────────────────────
@app.route('/api/ratings', methods=['POST'])
@jwt_required()
def create_rating():
    user_id = get_jwt_identity()
    data    = request.get_json()
    r = Rating(user_id=user_id, movie_id=data['movieId'], score=data['score'])
    db.session.add(r)
    db.session.commit()
    return jsonify({'message':'ok'}), 201

@app.route('/api/ratings/<int:user_id>', methods=['GET'])
@jwt_required()
def get_ratings(user_id):
    ratings = Rating.query.filter_by(user_id=user_id).all()
    return jsonify([{'movieId':r.movie_id,'score':r.score} for r in ratings]), 200


# ── Favorites endpoints ─────────────────────────────────────────────
def get_or_create_fav_list(user_id):
    fav_list = List.query.filter_by(user_id=user_id, name='favorites').first()
    if not fav_list:
        fav_list = List(name='favorites', user_id=user_id)
        db.session.add(fav_list)
        db.session.commit()
    return fav_list

@app.route('/api/recommend/user/favorites', methods=['GET','POST','DELETE'])
@jwt_required()
def user_favorites():
    user_id = get_jwt_identity()
    fav_list = get_or_create_fav_list(user_id)

    if request.method == 'GET':
        # возвращаем полный список фильмов и их тайтлы
        movies = []
        for lm in fav_list.movies:
            m = Movie.query.get(lm.movie_id)
            if m:
                movies.append({'movieId': m.movie_id, 'title': m.title})
        return jsonify(movies), 200

    data = request.get_json()
    movie_id = data.get('movieId')
    if request.method == 'POST':
        # добавляем связь ListMovie
        if not any(lm.movie_id==movie_id for lm in fav_list.movies):
            lm = ListMovie(list_id=fav_list.id, movie_id=movie_id)
            db.session.add(lm)
            db.session.commit()
        return jsonify({'message':'added'}), 201

    # DELETE
    lm = ListMovie.query.filter_by(list_id=fav_list.id, movie_id=movie_id).first()
    if lm:
        db.session.delete(lm)
        db.session.commit()
    return jsonify({'message':'deleted'}), 200


# ── Movie-based recommendations ─────────────────────────────────────
@app.route('/api/recommend/movie/<int:movie_id>', methods=['GET'])
def recommend_by_movie(movie_id):
    """
    Использует path-параметр movie_id, а не JSON.
    ?n= сколько вернуть
    ?alg= knn или svd
    """
    # читаем параметры
    try:
        n = int(request.args.get('n', 5))
    except ValueError:
        n = 5
    alg = request.args.get('alg', 'knn').lower()

    # получаем "сырые" рекомендации
    raw = svd_recommend(movie_id, n) if alg == 'svd' else knn_recommend(movie_id, n)

    # подтягиваем названия из БД
    out = []
    for r in raw:
        m = Movie.query.filter_by(movie_id=r['movieId']).first()
        if m:
            out.append({
                'movieId': m.movie_id,
                'title':   m.title,
                'score':   round(r['score'], 3)
            })
    return jsonify(out), 200

@app.route('/api/movies/search')
def search_local_movies():
    """Возвращает до 10 фильмов из локальной БД по части названия."""
    q = request.args.get('q','').strip()
    if not q:
        return jsonify([]), 200
    # ilike для нечувствительного поиска
    results = Movie.query.filter(Movie.title.ilike(f'%{q}%')) \
                         .order_by(Movie.title).limit(10).all()
    return jsonify([
        {'movieId': m.movie_id, 'title': m.title}
        for m in results
    ]), 200

# ── Run ─────────────────────────────────────────────────────────────
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
