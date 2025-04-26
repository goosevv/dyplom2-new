import os

class Config:
    # Путь к базе данных (SQLite для разработки)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql://reco_user:YourPass123@127.0.0.1/movie_reco"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Секретный ключ для JWT
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "super-secret-key"  # замените на свой в продакшне
    )

    # Ключ TMDB для получения постеров
    TMDB_API_KEY = os.getenv(
        "TMDB_API_KEY",
        "11c77e7e912d89b40d8920eb43d1d057"  # укажите здесь свой ключ или в переменных окружения
    )
