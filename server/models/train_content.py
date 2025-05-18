# server/models/train_content.py

import os
import pandas as pd
import pickle
from sklearn.preprocessing import MultiLabelBinarizer, MinMaxScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy import sparse

def load_data(data_dir="data/ml-latest"):
    movies = pd.read_csv(os.path.join(data_dir, "movies.csv"))
    tags   = pd.read_csv(os.path.join(data_dir, "tags.csv"))
    return movies, tags

def process_genres(movies):
    mlb = MultiLabelBinarizer()
    genre_lists = movies['genres'].str.split('|')
    genre_ohe = mlb.fit_transform(genre_lists)
    genre_df = pd.DataFrame(genre_ohe, columns=mlb.classes_, index=movies.index)
    return genre_df, mlb

def process_tags(tags, movies):
    agg = tags.groupby('movieId')['tag'].apply(lambda x: " ".join(x)).reset_index()
    merged = movies[['movieId']].merge(agg, on='movieId', how='left').fillna('')
    tfidf = TfidfVectorizer(max_features=5000)
    tag_matrix = tfidf.fit_transform(merged['tag'])
    return tag_matrix, tfidf

def process_year(movies):
    years = movies['title'].str.extract(r'\\((\\d{4})\\)')[0]
    years = pd.to_numeric(years, errors='coerce').fillna(0)
    scaler = MinMaxScaler()
    year_scaled = scaler.fit_transform(years.values.reshape(-1,1))
    return year_scaled, scaler

def build_content_features(
    data_dir="data/ml-latest",
    out_dir="models"
):
    movies, tags = load_data(data_dir)
    print("Loaded movies:", movies.shape, "tags:", tags.shape)

    genre_df, mlb = process_genres(movies)
    print("Genres OHE shape:", genre_df.shape)

    tag_matrix, tfidf = process_tags(tags, movies)
    print("Tags TF-IDF shape:", tag_matrix.shape)

    year_scaled, scaler = process_year(movies)
    print("Year feature shape:", year_scaled.shape)

    X = sparse.hstack([
        sparse.csr_matrix(genre_df.values),
        tag_matrix,
        sparse.csr_matrix(year_scaled)
    ], format='csr')
    print("Combined feature matrix shape:", X.shape)

    os.makedirs(out_dir, exist_ok=True)
    sparse.save_npz(os.path.join(out_dir, 'content_features.npz'), X)

    with open(os.path.join(out_dir, 'genre_mlb.pkl'), 'wb') as f:
        pickle.dump(mlb, f)
    with open(os.path.join(out_dir, 'tag_tfidf.pkl'), 'wb') as f:
        pickle.dump(tfidf, f)
    with open(os.path.join(out_dir, 'year_scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)

    movie_ids = movies['movieId'].values
    with open(os.path.join(out_dir, 'movie_id_map.pkl'), 'wb') as f:
        pickle.dump(movie_ids, f)

    print("Content features and artifacts saved to", out_dir)

if __name__ == "__main__":
    build_content_features()
