# seed_data.py

import os
import pandas as pd

from app import app
from extensions import db
from models.movie  import Movie
from models.rating import Rating
from models.user   import User

DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "ml-latest")


def seed_users():
    path = os.path.join(DATA_DIR, "ratings.csv")
    df = pd.read_csv(path, usecols=["userId"])
    user_ids = sorted(df["userId"].unique())
    users = []
    for uid in user_ids:
        u = User(
            id       = int(uid),
            name     = f"User{uid}",
            email    = f"user{uid}@example.com",
        )
        u.set_password("password")
        users.append(u)
    db.session.bulk_save_objects(users)
    db.session.commit()
    print(f"Inserted {len(users)} users")


def seed_movies():
    path = os.path.join(DATA_DIR, "movies.csv")
    df = pd.read_csv(path)
    movies = []
    for _, row in df.iterrows():
        movies.append(
            Movie(
                movie_id   = int(row.movieId),
                title      = row.title,
                popularity = float(row.get("popularity", 0)) if "popularity" in row else None
            )
        )
    db.session.bulk_save_objects(movies)
    db.session.commit()
    print(f"Inserted {len(movies)} movies")


def seed_ratings(limit=None):
    path = os.path.join(DATA_DIR, "ratings.csv")
    df = pd.read_csv(path)
    if limit:
        df = df.head(limit)
    ratings = []
    for _, row in df.iterrows():
        ratings.append(
            Rating(
                user_id  = int(row.userId),
                movie_id = int(row.movieId),
                score    = float(row.rating)
            )
        )
    db.session.bulk_save_objects(ratings)
    db.session.commit()
    print(f"Inserted {len(ratings)} ratings")


if __name__ == "__main__":
    with app.app_context():
        # --- Начинаем с чистого листа ---
        print("Cleaning existing data…")
        db.session.query(Rating).delete()
        db.session.query(Movie).delete()
        db.session.query(User).delete()
        db.session.commit()

        # --- Засеваем по порядку ---
        seed_users()
        seed_movies()
        seed_ratings()
        # Для начала можно ограничить, чтобы не грузить весь дат
