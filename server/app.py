import os
import re
import pickle
import traceback
import importlib.util
import pymysql

# Подмена MySQLdb
pymysql.install_as_MySQLdb()

import pandas as pd
import scipy.sparse
from sklearn.neighbors import NearestNeighbors

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)

from config import Config
from extensions import db, jwt

# ─── Инициализация Flask ───────────────────────────────────────────────
app = Flask(__name__)
app.config.from_object(Config)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", app.config["JWT_SECRET_KEY"])
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
db.init_app(app)
jwt.init_app(app)

# ─── Импорт моделей ORM ───────────────────────────────────────────────
from models.user import User
from models.rating import Rating
from models.user_list import List, ListMovie
from models.movie import Movie

# ─── Загрузка данных и моделей ─────────────────────────────────────────
MOVIES_CSV = os.path.join("data", "ml-latest", "movies.csv")
movies_df = pd.read_csv(MOVIES_CSV)

MODELS_DIR = "models"
# SVD
with open(os.path.join(MODELS_DIR, "svd_model.pkl"), "rb") as f:
    svd_model = pickle.load(f)
# KNN-CF
with open(os.path.join(MODELS_DIR, "knn_model.pkl"), "rb") as f:
    knn_model = pickle.load(f)
trainset = knn_model.trainset
# Content-based
with open(os.path.join(MODELS_DIR, "movie_id_map.pkl"), "rb") as f:
    movie_id_map = pickle.load(f)
content_features = scipy.sparse.load_npz(
    os.path.join(MODELS_DIR, "content_features.npz")
)
content_nn = NearestNeighbors(metric="cosine", algorithm="brute", n_neighbors=10)
content_nn.fit(content_features)
# Hybrid
spec = importlib.util.spec_from_file_location(
    "hybrid_module", os.path.join(MODELS_DIR, "hybrid.py")
)
hybrid = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hybrid)

# ─── Вспомогательные функции ───────────────────────────────────────────
def clean_title(title: str) -> str:
    t = re.sub(r"\s*\(\d{4}\)$", "", title)
    m = re.match(r"^(.+),\s*(The|A|An)$", t, flags=re.IGNORECASE)
    if m:
        t = f"{m.group(2)} {m.group(1)}"
    return t

# ─── Эндпоинты аутентификации ────────────────────────────────────────
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    if not name or not email or not password:
        return jsonify(error="Будь ласка, заповніть усі поля."), 400
    if User.query.filter_by(email=email).first():
        return jsonify(error="Email вже використовується."), 400
    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify(message="Реєстрація успішна!"), 200

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify(error="Невірний логін або пароль."), 401
    token = create_access_token(identity=str(user.id))
    return jsonify(access_token=token, user={"id": user.id, "name": user.name}), 200

# ─── Поисковый эндпоинт ───────────────────────────────────────────────
@app.route("/search", methods=["GET"])
def search():
    q = request.args.get("q", "").strip().lower()
    if not q:
        return jsonify([])
    df = movies_df[movies_df.title.str.lower().str.contains(q)]
    return jsonify(df[["movieId", "title"]].head(10).to_dict("records"))

# ─── Эндпоинты рекомендаций ───────────────────────────────────────────
@app.route("/recommend/svd/<int:user_id>", methods=["GET"])
def rec_svd(user_id):
    ids = movies_df.movieId.tolist()
    preds = [(mid, svd_model.predict(user_id, mid).est) for mid in ids]
    top10 = sorted(preds, key=lambda x: x[1], reverse=True)[:10]
    return jsonify([
        {"movieId": m, "title": movies_df.loc[movies_df.movieId == m, "title"].iloc[0]}
        for m, _ in top10
    ])

@app.route("/recommend/knn/<int:user_id>", methods=["GET"])
def rec_knn(user_id):
    try:
        iu = trainset.to_inner_uid(str(user_id))
        neighs = knn_model.get_neighbors(iu, k=10)
        mids = [int(trainset.to_raw_iid(i)) for i in neighs]
    except:
        mids = []
    if not mids:
        mids = movies_df.sort_values("popularity", ascending=False).movieId.head(10).tolist()
    return jsonify([
        {"movieId": m, "title": movies_df.loc[movies_df.movieId == m, "title"].iloc[0]}
        for m in mids
    ])

@app.route("/recommend/content/<int:movie_id>", methods=["GET"])
def rec_content(movie_id):
    idx = movie_id_map.get(movie_id)
    if idx is None:
        return rec_cf(movie_id)
    _, neighs = content_nn.kneighbors(content_features[idx], n_neighbors=10)
    inv_map = {v: k for k, v in movie_id_map.items()}
    results = []
    for n in neighs[0]:
        mid = inv_map[n]
        title = movies_df.loc[movies_df.movieId == mid, 'title'].iloc[0]
        results.append({'movieId': mid, 'title': title})
    return jsonify(results)

@app.route("/recommend/cf/<int:movie_id>", methods=["GET"])
def rec_cf(movie_id):
    ids = movies_df.movieId.tolist()
    preds = [(mid, svd_model.predict(0, mid).est) for mid in ids]
    top = sorted(preds, key=lambda x: x[1], reverse=True)[1:11]
    return jsonify([
        {'movieId': m, 'title': movies_df.loc[movies_df.movieId == m, 'title'].iloc[0]}
        for m, _ in top
    ])

@app.route("/recommend/movie/<int:movie_id>", methods=["GET"])
def rec_by_movie(movie_id):
    return rec_content(movie_id)

@app.route("/recommend/hybrid/<int:user_id>", methods=["GET"])
def rec_hybrid(user_id):
    ids = movies_df.movieId.tolist()
    preds = [(mid, hybrid.predict(user_id, mid)) for mid in ids]
    top10 = sorted(preds, key=lambda x: x[1], reverse=True)[:10]
    return jsonify([
        {"movieId": m, "title": movies_df.loc[movies_df.movieId == m, "title"].iloc[0]}
        for m, _ in top10
    ])

# ─── Новый эндпоинт: топ-N рекомендаций по SVD ─────────────────────────
@app.route("/api/recommendations/<int:user_id>", methods=["GET"])
def api_recommendations(user_id):
    n = request.args.get("n", default=10, type=int)
    movie_ids = movies_df.movieId.tolist()
    preds = []
    for mid in movie_ids:
        try:
            score = svd_model.predict(user_id, mid).est
        except:
            score = 0
        preds.append((mid, score))
    top_n = sorted(preds, key=lambda x: x[1], reverse=True)[:n]
    result = []
    for mid, score in top_n:
        m = Movie.query.get(mid)
        title = getattr(m, "title_uk", None) or movies_df.loc[movies_df.movieId == mid, "title"].iloc[0]
        result.append({
            "movie_id": mid,
            "title": title,
            "score": round(score, 4)
        })
    return jsonify(result)

# ─── Эндпоинты рейтингов и избранного ─────────────────────────────────
@app.route("/rate", methods=["POST"])
@jwt_required()
def rate_movie():
    data = request.get_json() or {}
    mid = data.get("movieId")
    score = data.get("score")
    try:
        score = float(score)
    except:
        return jsonify(error="Невірний формат"), 400
    if mid is None or not (1 <= score <= 5):
        return jsonify(error="Невірні дані"), 400
    uid = int(get_jwt_identity())
    r = Rating.query.filter_by(user_id=uid, movie_id=mid).first()
    if r:
        r.score = score
    else:
        db.session.add(Rating(user_id=uid, movie_id=mid, score=score))
    db.session.commit()
    return jsonify(message="Оцінка збережена."), 200

@app.route("/like/<int:movie_id>", methods=["POST"])
@jwt_required()
def like_movie(movie_id):
    try:
        uid = int(get_jwt_identity())
        fav = List.query.filter_by(user_id=uid, name="Favorites").first()
        if not fav:
            fav = List(name="Favorites", user_id=uid)
            db.session.add(fav)
            db.session.commit()
        if not ListMovie.query.filter_by(list_id=fav.id, movie_id=movie_id).first():
            db.session.add(ListMovie(list_id=fav.id, movie_id=movie_id))
            db.session.commit()
        return jsonify(message="Added to Favorites"), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify(error=str(e)), 500

@app.route("/like/<int:movie_id>", methods=["DELETE"])
@jwt_required()
def unlike_movie(movie_id):
    uid = int(get_jwt_identity())
    fav = List.query.filter_by(user_id=uid, name="Favorites").first()
    if fav:
        ListMovie.query.filter_by(list_id=fav.id, movie_id=movie_id).delete()
        db.session.commit()
    return jsonify(message="Removed from Favorites"), 200

@app.route("/favorites", methods=["GET"])
@jwt_required()
def get_favorites():
    uid = int(get_jwt_identity())
    fav = List.query.filter_by(user_id=uid, name="Favorites").first()
    if not fav:
        return jsonify([]), 200
    out = [
        {"movieId": lm.movie_id, "title": movies_df.loc[movies_df.movieId == lm.movie_id, "title"].iloc[0]}
        for lm in fav.movies
    ]
    return jsonify(out), 200

@app.route("/recommend/user/favorites", methods=["GET"])
@jwt_required()
def recommend_from_favorites():
    uid = int(get_jwt_identity())
    fav = List.query.filter_by(user_id=uid, name="Favorites").first()
    if not fav:
        return jsonify([]), 200
    scores = {}
    for lm in fav.movies:
        try:
            ii = trainset.to_inner_iid(str(lm.movie_id))
            neighs = knn_model.get_neighbors(ii, k=10)
            for rank, iid in enumerate(neighs, 1):
                raw = int(trainset.to_raw_iid(iid))
                scores[raw] = scores.get(raw, 0) + 1.0 / rank
        except:
            continue
    for lm in fav.movies:
        scores.pop(lm.movie_id, None)
    top10 = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:10]
    return jsonify([
        {"movieId": m, "title": movies_df.loc[movies_df.movieId == m, "title"].iloc[0]}
        for m, _ in top10
    ])

# ─── Запуск приложения ────────────────────────────────────────────────
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=True)
