# server/train_models.py

import os
import pickle
import pandas as pd
import scipy.sparse
from surprise import Dataset, Reader, SVD, KNNBasic
from sklearn.neighbors import NearestNeighbors

# ── Пути ────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(__file__)
DATA_DIR   = os.path.join(BASE_DIR, "data", "ml-latest")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# ── 1) Загружаем все рейтинги ─────────────────────────────────────────
ratings_csv = os.path.join(DATA_DIR, "ratings.csv")
ratings_df  = pd.read_csv(ratings_csv, usecols=["userId","movieId","rating"])
print(f"Loaded {len(ratings_df)} ratings")

# ── 2) Собираем full_trainset с любыми рейтингами ───────────────────────
reader        = Reader(rating_scale=(ratings_df.rating.min(), ratings_df.rating.max()))
data          = Dataset.load_from_df(ratings_df[["userId","movieId","rating"]], reader)
full_trainset = data.build_full_trainset()
print("Unique users:", full_trainset.n_users, " Unique items:", full_trainset.n_items)

# ── 3a) Обучаем SVD на полном наборе ────────────────────────────────────
print("Training SVD on full_trainset...")
svd = SVD(n_factors=50, n_epochs=20, lr_all=0.005, reg_all=0.02)
svd.fit(full_trainset)
with open(os.path.join(MODELS_DIR, "svd_model.pkl"), "wb") as f:
    pickle.dump(svd, f)
print("✔ svd_model.pkl saved")

# ── 3b) Обучаем KNNBasic на полном наборе ──────────────────────────────
print("Training KNNBasic on full_trainset...")
sim_options = {"name":"cosine", "user_based":False}
knn = KNNBasic(sim_options=sim_options)
knn.fit(full_trainset)
with open(os.path.join(MODELS_DIR, "knn_model.pkl"), "wb") as f:
    pickle.dump(knn, f)
print("✔ knn_model.pkl saved")

# ── 4) Контентная модель (оставляем без изменений) ──────────────────────
tfidf_path    = os.path.join(MODELS_DIR, "tag_tfidf.pkl")
idmap_path    = os.path.join(MODELS_DIR, "movie_id_map.pkl")
features_path = os.path.join(MODELS_DIR, "content_features.npz")

with open(tfidf_path, "rb") as f:      vectorizer   = pickle.load(f)
with open(idmap_path, "rb") as f:      movie_id_map = pickle.load(f)
content_features = scipy.sparse.load_npz(features_path)

nn = NearestNeighbors(n_neighbors=20, metric="cosine", algorithm="brute")
nn.fit(content_features)
with open(os.path.join(MODELS_DIR, "content_nn.pkl"), "wb") as f:
    pickle.dump((nn, movie_id_map), f)
print("✔ content_nn.pkl saved")

# ── 5) Простой гибрид ───────────────────────────────────────────────────
hybrid_py = os.path.join(MODELS_DIR, "hybrid.py")
with open(hybrid_py, "w", encoding="utf-8") as f:
    f.write("""\
import pickle
from surprise import SVD, KNNBasic

with open("models/svd_model.pkl","rb") as f:  svd = pickle.load(f)
with open("models/knn_model.pkl","rb") as f: knn = pickle.load(f)

def predict(user_id, movie_id, w_svd=0.5, w_knn=0.5):
    return w_svd * svd.predict(user_id, movie_id).est \
         + w_knn * knn.predict(user_id, movie_id).est
""")
print("✔ hybrid.py saved")
print("✅ Training complete.")
