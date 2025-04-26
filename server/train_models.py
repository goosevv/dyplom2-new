# train_models.py

import os
import pickle
import pandas as pd
from surprise import Dataset, Reader, SVD, KNNBasic
from surprise.model_selection import train_test_split
from sklearn.neighbors import NearestNeighbors
from extensions import db  # если нужно подключение к БД
from models.movie import Movie  # для доступа к movie_id_map, если нужно

# Пути
DATA_DIR   = os.path.join("data", "ml-latest")
MODELS_DIR = "models"

# ─── 1) Загружаем рейтинги ────────────────────────────────────────────────
ratings_path = os.path.join(DATA_DIR, "ratings.csv")
ratings_df   = pd.read_csv(ratings_path, usecols=["userId","movieId","rating"])

# Surprise требует свой формат
reader = Reader(rating_scale=(ratings_df.rating.min(), ratings_df.rating.max()))
data   = Dataset.load_from_df(ratings_df[["userId","movieId","rating"]], reader)
trainset, testset = train_test_split(data, test_size=0.2, random_state=42)

# ─── 2a) Обучаем SVD ─────────────────────────────────────────────────────
print("Training SVD...")
svd = SVD(n_factors=50, n_epochs=20, lr_all=0.005, reg_all=0.02)
svd.fit(trainset)
# тест (опционально)
# from surprise import accuracy
# preds = svd.test(testset)
# print("SVD RMSE:", accuracy.rmse(preds))

with open(os.path.join(MODELS_DIR, "svd_model.pkl"), "wb") as f:
    pickle.dump(svd, f)
print("Saved svd_model.pkl")

# ─── 2b) Обучаем KNN‑CF ──────────────────────────────────────────────────
print("Training KNNBasic (item‑based CF)...")
sim_options = {"name":"cosine", "user_based":False}
knn = KNNBasic(k=40, sim_options=sim_options)
knn.fit(trainset)  # для KNNBasic нет .trainset, он внутри
with open(os.path.join(MODELS_DIR, "knn_model.pkl"), "wb") as f:
    pickle.dump(knn, f)
print("Saved knn_model.pkl")

# ─── 3) Обучаем TF×IDF (контент) ─────────────────────────────────────────
# Загружаем предварительно построенные признаки
tfidf_path    = os.path.join(MODELS_DIR, "tag_tfidf.pkl")
idmap_path    = os.path.join(MODELS_DIR, "movie_id_map.pkl")
features_path = os.path.join(MODELS_DIR, "content_features.npz")

print("Loading TF×IDF features...")
with open(tfidf_path, "rb") as f:
    vectorizer = pickle.load(f)           # TfidfVectorizer
with open(idmap_path, "rb") as f:
    movie_id_map = pickle.load(f)         # {movieId: row_index, ...}
import scipy.sparse
content_features = scipy.sparse.load_npz(features_path)  # shape (n_movies, n_features)

# Строим nearest‑neighbors по контенту
print("Training NearestNeighbors on content features...")
nn = NearestNeighbors(n_neighbors=20, metric="cosine", algorithm="brute")
nn.fit(content_features)
with open(os.path.join(MODELS_DIR, "content_nn.pkl"), "wb") as f:
    pickle.dump((nn, movie_id_map), f)
print("Saved content_nn.pkl")

# ─── 4) Готовим гибридную функцию ────────────────────────────────────────
# В гибриде мы просто усредняем предсказания SVD и KNN:
hybrid_code = """
import pickle
from surprise import SVD, KNNBasic
with open("models/svd_model.pkl","rb") as f:      svd = pickle.load(f)
with open("models/knn_model.pkl","rb") as f:     knn = pickle.load(f)
def predict(user_id, movie_id, w_svd=0.5, w_knn=0.5):
    p1 = svd.predict(user_id, movie_id).est
    p2 = knn.predict(user_id, movie_id).est
    return w_svd*p1 + w_knn*p2
"""
with open(os.path.join(MODELS_DIR, "hybrid.py"), "w") as f:
    f.write(hybrid_code)
print("Saved hybrid.py (simple weighted average)")

print("All models trained and saved.")
