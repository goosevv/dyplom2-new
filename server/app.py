# server/app.py

import os
import pickle
from flask import Flask, request, jsonify
from extensions import db, jwt
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from surprise import dump
import joblib
import scipy
import scipy.sparse as sp
# ── Init Flask ─────────────────────────────────────────────────────
app = Flask(__name__)
from config import Config
app.config.from_object(Config)

db.init_app(app)
jwt.init_app(app)
CORS(app)

# ── SQLAlchemy Models ─────────────────────────────────────────────
from models.user       import User
from models.movie      import Movie
from models.rating     import Rating
from models.user_list  import List, ListMovie

# ── Load ML models ─────────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
id_to_idx = joblib.load(os.path.join(MODELS_DIR, 'movie_id_to_index.pkl'))
idx_to_id = joblib.load(os.path.join(MODELS_DIR, 'index_to_movie_id.pkl'))
knn_model = joblib.load(os.path.join(MODELS_DIR, 'knn_model.pkl'))
svd_model = joblib.load(os.path.join(MODELS_DIR, 'svd_model.pkl'))
content_nn = joblib.load(os.path.join(MODELS_DIR, 'content_nn.pkl'))
content_features = sp.load_npz(os.path.join(MODELS_DIR, 'content_features.npz'))

trainset = knn_model.trainset
_raw2inner = getattr(trainset, '_raw2inner_id_items', None) or trainset._raw2inner_id_items
VALID_IDS = set(int(rid) for rid in trainset._raw2inner_id_items.keys())
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

def content_recommend(movie_id: int, n: int):
    idx = id_to_idx.get(movie_id)
    if idx is None:
        return []
        dists, neighs = content_nn.kneighbors(
           content_features[idx], n_neighbors=n+1
     )
    recs = []
    for dist, neigh_idx in zip(dists[0][1:], neighs[0][1:]):
        raw_id = idx_to_id[neigh_idx]
        recs.append({"movieId": raw_id, "score": 1 - dist})
    return recs

def svd_fallback(n:int):
    # допустим user_id=1 (или средний user), или можно брать весь VALID_IDS
    preds = [(mid, svd_model.predict(1, mid).est) for mid in VALID_IDS]
    top = sorted(preds, key=lambda x: -x[1])[:n]
    return [{"movieId": mid, "score": score} for mid, score in top]
raw = knn_recommend(movie_id, n)
if not raw:
    raw = content_recommend(movie_id, n)
if not raw:
    raw = svd_fallback(n)

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
    raw = knn_recommend(movie_id, n) if alg=='knn' else svd_recommend(movie_id, n)

    if not raw:
        top = Movie.query.order_by(Movie.popularity.desc()).limit(n).all()
        raw = [{'movieId': m.movie_id, 'score': 0} for m in top]

    out = []
    for r in raw:
        m = Movie.query.filter_by(movie_id=r['movieId']).first()
        if m:
            out.append({'movieId':m.movie_id,'title':m.title,'score':round(r['score'],3)})
    return jsonify(out), 200

@app.route('/api/movies/search')
def search_local_movies():
    q = request.args.get('q','').strip()
    if not q:
        return jsonify([]), 200

    results = Movie.query \
        .filter(
            Movie.title.ilike(f'%{q}%'),
            Movie.movie_id.in_(VALID_IDS)         # ❗️ только с рейтингами
        ) \
        .order_by(Movie.title) \
        .limit(10) \
        .all()

    return jsonify([{'movieId': m.movie_id, 'title': m.title} for m in results]), 200

# ── Run ─────────────────────────────────────────────────────────────
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
