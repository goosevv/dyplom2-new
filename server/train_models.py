# server/train_models.py

import os
import pickle
import pandas as pd
import scipy.sparse
from surprise import Dataset, Reader, SVD, KNNBasic
from sklearn.neighbors import NearestNeighbors

# ── ПУТИ ─────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(__file__)
DATA_DIR   = os.path.join(BASE_DIR, "data", "ml-latest")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# ── 1) Загружаем все рейтинги ────────────────────────────────────────
ratings_csv = os.path.join(DATA_DIR, "ratings.csv")
print(f"Loading ratings from {ratings_csv}")
ratings_df = pd.read_csv(ratings_csv, usecols=["userId","movieId","rating"])

# ── 2) Готовим полный датасет Surprise ────────────────────────────────
reader        = Reader(rating_scale=(ratings_df.rating.min(), ratings_df.rating.max()))
data          = Dataset.load_from_df(ratings_df[["userId","movieId","rating"]], reader)
full_trainset = data.build_full_trainset()

# ── 3a) Обучаем SVD ────────────────────────────────────────────────────
print("Training SVD on full_trainset...")
svd = SVD(n_factors=50, n_epochs=20, lr_all=0.005, reg_all=0.02)
svd.fit(full_trainset)
with open(os.path.join(MODELS_DIR, "svd_model.pkl"), "wb") as f:
    pickle.dump(svd, f)
print("✔ Saved svd_model.pkl")

# ── 3b) Обучаем KNNBasic (item-based CF) ──────────────────────────────
print("Training KNNBasic (item-based CF) on full_trainset...")
sim_options = {"name":"cosine", "user_based":False}
knn = KNNBasic(sim_options=sim_options)
knn.fit(full_trainset)
with open(os.path.join(MODELS_DIR, "knn_model.pkl"), "wb") as f:
    pickle.dump(knn, f)
print("✔ Saved knn_model.pkl")

# ── 4) Контентная часть (не трогаем) ──────────────────────────────────
tfidf_path    = os.path.join(MODELS_DIR, "tag_tfidf.pkl")
idmap_path    = os.path.join(MODELS_DIR, "movie_id_map.pkl")
features_path = os.path.join(MODELS_DIR, "content_features.npz")

print("Loading TF×IDF & content features...")
with open(tfidf_path, "rb") as f:
    vectorizer      = pickle.load(f)
with open(idmap_path, "rb") as f:
    movie_id_map    = pickle.load(f)
content_features = scipy.sparse.load_npz(features_path)

print("Training NearestNeighbors on content features...")
nn = NearestNeighbors(n_neighbors=20, metric="cosine", algorithm="brute")
nn.fit(content_features)
with open(os.path.join(MODELS_DIR, "content_nn.pkl"), "wb") as f:
    pickle.dump((nn, movie_id_map), f)
print("✔ Saved content_nn.pkl")

# ── 5) Гибрид (пример) ────────────────────────────────────────────────
hybrid_code = """
import pickle
from surprise import SVD, KNNBasic

with open("models/svd_model.pkl","rb") as f:    svd = pickle.load(f)
with open("models/knn_model.pkl","rb") as f:   knn = pickle.load(f)

def predict(user_id, movie_id, w_svd=0.5, w_knn=0.5):
    p1 = svd.predict(user_id, movie_id).est
    p2 = knn.predict(user_id, movie_id).est
    return w_svd * p1 + w_knn * p2
"""
with open(os.path.join(MODELS_DIR, "hybrid.py"), "w", encoding="utf-8") as f:
    f.write(hybrid_code)
print("✔ Saved hybrid.py")

print("✅ Все модели обучены и сохранены.")
