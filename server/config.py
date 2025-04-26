import os
from dotenv import load_dotenv

# если у вас нет .env — можно убрать, но оставим на будущее
load_dotenv()

SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret')

class Config:
    # Привязка к MySQL: ASCII-пароль, имя пользователя и имя БД
    SQLALCHEMY_DATABASE_URI = "mysql+mysqlconnector://goose:413153@localhost:3306/dyplom3?charset=utf8mb4"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # остальные ваши настройки
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key")
    TMDB_API_KEY    = os.getenv("TMDB_API_KEY",    "11c77e7e912d89b40d8920eb43d1d057")
