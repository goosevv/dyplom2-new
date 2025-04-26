import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://goose:413153@localhost:3306/dyplom3?charset=utf8mb4"
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
