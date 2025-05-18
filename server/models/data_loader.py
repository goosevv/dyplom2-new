import pandas as pd

def load_ratings(path: str = "data/ml-latest/ratings.csv") -> pd.DataFrame:
    """
    Полный датасет MovieLens Latest (25M):
    возвращает DataFrame с колонками userId, movieId, rating.
    """
    df = pd.read_csv(path)
    # Оставляем только нужные колонки
    return df[["userId", "movieId", "rating"]]

def load_movies(path: str = "data/ml-latest/movies.csv") -> pd.DataFrame:
    """
    Полный список фильмов:
    возвращает DataFrame с колонками movieId, title, genres.
    """
    df = pd.read_csv(path)
    return df[["movieId", "title", "genres"]]

def load_links(path: str = "data/ml-latest/links.csv") -> pd.DataFrame:
    """
    Полная таблица связей:
    возвращает DataFrame с колонками movieId, imdbId, tmdbId.
    """
    df = pd.read_csv(path, dtype={"imdbId": str})
    df["movieId"] = df["movieId"].astype(int)
    df["tmdbId"]  = pd.to_numeric(df["tmdbId"], errors="coerce") \
                       .fillna(0).astype(int)
    return df[["movieId", "imdbId", "tmdbId"]]
