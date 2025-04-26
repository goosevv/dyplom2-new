# make_movie_id_map.py
import os
import pandas as pd
import pickle

# где лежит ваш movies.csv
MOVIES_CSV = os.path.join("data", "ml-latest", "movies.csv")
# куда сохранять новый mapping
OUT_PATH   = os.path.join("models", "movie_id_map.pkl")

df = pd.read_csv(MOVIES_CSV, usecols=["movieId"])
# строим dict: movieId → строковый индекс
movie_ids = df["movieId"].tolist()
movie_id_map = {int(mid): idx for idx, mid in enumerate(movie_ids)}

with open(OUT_PATH, "wb") as f:
    pickle.dump(movie_id_map, f)

print(f"Saved dict mapping for {len(movie_id_map)} movies to {OUT_PATH}")
