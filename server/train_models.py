# train_models.py

import os
import pickle
import pandas as pd
import scipy.sparse
from surprise import Dataset, Reader, SVD, KNNBasic
from sklearn.neighbors import NearestNeighbors
from extensions import db           # если нужен доступ к БД
from models.movie import Movie      # для movie_id_map, если потребуется

# Пути
DATA_DIR   = os.path.join("data", "ml-latest")
MODELS_DIR = "models"
os.makedirs(MODELS_DIR, exist_ok=True)

# ─── 1) Загружаем все рейтинги ─────────────────────────────────────────
ratings_path = os.path.join(DATA_DIR, "ratings.csv")
ratings_df   = pd.read_csv(ratings_path, usecols=["userId","movieId","rating"])

# ─── 2) Формируем full_trainset для Surprise ───────────────────────────
reader = Reader(rating_scale=(ratings_df.rating.min(), ratings_df.rating.max()))
data   = Dataset.load_from_df(ratings_df[["userId","movieId","rating"]], reader)
full_trainset = data.build_full_trainset()

# ─── 3a) Обучаем SVD на полном наборе ──────────────────────────────────
print("Training SVD on full_trainset...")
svd = SVD(n_factors=50, n_epochs=20, lr_all=0.005, reg_all=0.02)
svd.fit(full_trainset)
with open(os.path.join(MODELS_DIR, "svd_model.pkl"), "wb") as f:
    pickle.dump(svd, f)
print("Saved svd_model.pkl")

# ─── 3b) Обучаем KNNBasic (item-based CF) на полном наборе ─────────────
print("Training KNNBasic (item-based CF) on full_trainset...")
sim_options = {"name":"cosine", "user_based":False}
knn = KNNBasic(sim_options=sim_options)
knn.fit(full_trainset)
with open(os.path.join(MODELS_DIR, "knn_model.pkl"), "wb") as f:
    pickle.dump(knn, f)
print("Saved knn_model.pkl")

# ─── 4) Загружаем контентные признаки и обучаем NearestNeighbors ──────
tfidf_path    = os.path.join(MODELS_DIR, "tag_tfidf.pkl")
idmap_path    = os.path.join(MODELS_DIR, "movie_id_map.pkl")
features_path = os.path.join(MODELS_DIR, "content_features.npz")

print("Loading TF×IDF features...")
with open(tfidf_path,    "rb") as f:
    vectorizer      = pickle.load(f)           # TfidfVectorizer
with open(idmap_path,    "rb") as f:
    movie_id_map    = pickle.load(f)           # {movieId: row_index, ...}
content_features = scipy.sparse.load_npz(features_path)  # shape (n_movies, n_features)

print("Training NearestNeighbors on content features...")
nn = NearestNeighbors(n_neighbors=20, metric="cosine", algorithm="brute")
nn.fit(content_features)
with open(os.path.join(MODELS_DIR, "content_nn.pkl"), "wb") as f:
    pickle.dump((nn, movie_id_map), f)
print("Saved content_nn.pkl")

# ─── 5) Пишем простой гибрид в файл ────────────────────────────────────
hybrid_code = """
import pickle
from surprise import SVD, KNNBasic

with open("models/svd_model.pkl","rb") as f:  svd = pickle.load(f)
with open("models/knn_model.pkl","rb") as f: svd_knn = pickle.load(f)

def predict(user_id, movie_id, w_svd=0.5, w_knn=0.5):
    p1 = svd.predict(user_id, movie_id).est
    p2 = svd_knn.predict(user_id, movie_id).est
    return w_svd * p1 + w_knn * p2
"""
with open(os.path.join(MODELS_DIR, "hybrid.py"), "w", encoding="utf-8") as f:
    f.write(hybrid_code)
print("Saved hybrid.py (weighted average of SVD & KNNBasic)")

print("All models trained and saved.")   # :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
