#!/usr/bin/env python3
# train_ml_latest_small.py

import os
from datetime import datetime

import pandas as pd
import numpy as np
import scipy.sparse as sp
import joblib

from sklearn.preprocessing import MultiLabelBinarizer, MinMaxScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors

from surprise import Dataset, Reader, SVD, KNNBasic

# ── ПУТИ ─────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(__file__)
DATA_DIR   = os.path.join(BASE_DIR, "data", "ml-latest")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

print(f"[{datetime.now()}] Старт тренировки на ml-latest")

# ── 1) CONTENT-ЧАСТЬ ──────────────────────────────────────────────────

# 1.1. Загрузка фильмов
movies = pd.read_csv(os.path.join(DATA_DIR, "movies.csv"))
# выделяем год из названия (если есть)
movies["year"] = (
    movies["title"]
    .str.extract(r"\((\d{4})\)$", expand=False)
    .fillna(0)
    .astype(int)
)
# готовим список жанров
movies["genres_list"] = (
    movies["genres"]
    .str.split("|")
    .apply(lambda L: [] if L == ["(no genres listed)"] else L)
)

# 1.2. One-Hot жанры
mlb = MultiLabelBinarizer(sparse_output=True)
genre_sparse = mlb.fit_transform(movies["genres_list"])  # (n_movies × n_genres)

# 1.3. Нормализованный год
year_arr    = movies[["year"]].values  # (n_movies × 1)
year_scaled = MinMaxScaler().fit_transform(year_arr)
year_sparse = sp.csr_matrix(year_scaled)  # (n_movies × 1)

# 1.4. TF-IDF по пользовательским тегам
tags = pd.read_csv(os.path.join(DATA_DIR, "tags.csv"))
# склеиваем все теги одного фильма в одну строку
tags_by_movie = (
    tags.groupby("movieId")["tag"]
    .agg(lambda L: " ".join(L.astype(str)))
    .reindex(movies.movieId, fill_value="")
    .values
)
tfidf = TfidfVectorizer(max_features=2000)
tag_sparse = tfidf.fit_transform(tags_by_movie)  # (n_movies × n_terms)
# сохраняем сам векторизатор, если понадобится на фронте
joblib.dump(tfidf, os.path.join(MODELS_DIR, "tag_vectorizer.pkl"))

# 1.5. Собираем итоговую матрицу признаков
content_features = sp.hstack(
    [genre_sparse, year_sparse, tag_sparse],
    format="csr"
)
print(f"[{datetime.now()}] content_features shape: {content_features.shape}")

# 1.6. Сохраняем маппинг movieId ↔ индекс
id_to_idx = dict(zip(movies.movieId, range(len(movies))))
idx_to_id = {v: k for k, v in id_to_idx.items()}
joblib.dump(id_to_idx, os.path.join(MODELS_DIR, "movie_id_to_index.pkl"))
joblib.dump(idx_to_id, os.path.join(MODELS_DIR, "index_to_movie_id.pkl"))

# 1.7. Сохраняем content_features
sp.save_npz(os.path.join(MODELS_DIR, "content_features.npz"), content_features)
print(f"[{datetime.now()}] Сохранили content_features и mappings")

# 1.8. Обучаем NearestNeighbors по content
nn = NearestNeighbors(metric="cosine", algorithm="brute")
nn.fit(content_features)
joblib.dump(nn, os.path.join(MODELS_DIR, "content_nn.pkl"))
print(f"[{datetime.now()}] ✔ content_nn обучен и сохранён")

# ── 2) COLLAB-ЧАСТЬ ───────────────────────────────────────────────────

# 2.1. Загрузка рейтингов
ratings = pd.read_csv(os.path.join(DATA_DIR, "ratings.csv"))

# 2.2. Обучение Surprise SVD
reader   = Reader(rating_scale=(ratings.rating.min(), ratings.rating.max()))
data     = Dataset.load_from_df(ratings[["userId","movieId","rating"]], reader)
trainset = data.build_full_trainset()
print(f"[{datetime.now()}] Training SVD on {trainset.n_users} users, {trainset.n_items} items…")
svd = SVD(n_factors=50, n_epochs=20, lr_all=0.005, reg_all=0.02)
svd.fit(trainset)
joblib.dump(svd, os.path.join(MODELS_DIR, "svd_model.pkl"))
print(f"[{datetime.now()}] ✔ svd_model.pkl saved")

# 2.3. Обучение Surprise KNNBasic (item-based)
print(f"[{datetime.now()}] Training KNNBasic (item-based)…")
sim_options = {"name": "cosine", "user_based": False}
knn = KNNBasic(sim_options=sim_options)
knn.fit(trainset)
joblib.dump(knn, os.path.join(MODELS_DIR, "knn_model.pkl"))
print(f"[{datetime.now()}] ✔ knn_model.pkl saved")

print(f"[{datetime.now()}] ✅ Пайплайн ml-latest завершён. Все модели в {MODELS_DIR}")
