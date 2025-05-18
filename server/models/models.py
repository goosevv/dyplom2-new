# models/models.py (ПОВНА ВИПРАВЛЕНА ВЕРСІЯ)

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.sql import func
from sqlalchemy import event, select, UniqueConstraint # Додано UniqueConstraint
from werkzeug.security import generate_password_hash, check_password_hash

# --- Імпорт db з extensions ---
import sys
import os
# Додаємо батьківську директорію до шляху пошуку модулів
# Це припускає, що папка models/ знаходиться всередині основної папки додатку (наприклад, server/)
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    # Тепер імпорт має спрацювати
    from extensions import db
    print("[models.py] Імпортовано 'db' з extensions.py")
except ImportError:
    print("[models.py] ПОМИЛКА: Не вдалося імпортувати 'db' з extensions.py.")
    print(f"             Перевірте структуру проекту та наявність extensions.py у {parent_dir}")
    print("             і містить 'db = SQLAlchemy()'. Або адаптуйте цей імпорт.")
    # Якщо це критично для роботи, зупиняємо виконання
    raise ImportError("Необхідно надати екземпляр SQLAlchemy 'db'")


# --- Таблиця Ролей ---
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) # 'admin', 'user'
    users = db.relationship('User', backref='role', lazy=True)

# --- Таблиця Користувачів ---
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.Text, nullable=False) # Тип Text як у вас
    name = db.Column(db.String(120), nullable=False) # Збільшено довжину
    # Припускаємо, що роль 'user' матиме ID=3 після завантаження
    role_id = db.Column(
        db.Integer,
        db.ForeignKey('roles.id'),
        nullable=False,
        default=2    # здесь 2 — ID роли «user»
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Зв'язки
    ratings = db.relationship('Rating', backref='user', lazy='dynamic', cascade="all, delete-orphan")
    lists = db.relationship('MovieList', back_populates="owner", lazy='dynamic', foreign_keys='MovieList.user_id', cascade="all, delete-orphan")
    saved_movies = db.relationship('SavedMovie', backref='user', lazy='dynamic', cascade="all, delete-orphan")
    tags = db.relationship('Tag', backref='user', lazy='dynamic', cascade="all, delete-orphan")
    list_ratings = db.relationship('ListRating', backref='user', lazy='dynamic', cascade="all, delete-orphan")
    saved_list_subscriptions = db.relationship('SavedList', backref='user', lazy='dynamic', cascade="all, delete-orphan")

    # Методи з вашого user.py
    def set_password(self, raw):
        self.password = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password, raw)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email}

# --- Таблиця Фільмів ---
class Movie(db.Model):
    __tablename__ = 'movies'
    # !!! ВИКОРИСТОВУЄМО movie_id ЯК ПЕРВИННИЙ КЛЮЧ !!!
    movie_id = db.Column(db.Integer, primary_key=True) # <--- ВИПРАВЛЕНО
    title_en = db.Column(db.String(255), nullable=False) # Англійська назва (з CSV 'title')
    title_uk = db.Column(db.String(255), nullable=True)  # Українська назва (з CSV 'title_uk')
    year = db.Column(db.Integer, nullable=True)         # Рік (з CSV)
    studio = db.Column(db.String(150), nullable=True)    # Студія (з CSV)
    genres_str = db.Column(db.String(255), nullable=True) # Зберігаємо оригінальну строку жанрів з CSV 'genres'
    popularity = db.Column(db.Float, nullable=True)      # Поле з вашого movie.py

    # Зв'язок з жанрами (багато-до-багатьох) через таблицю movie_genres
    genres = db.relationship('Genre', secondary='movie_genres', backref=db.backref('movies', lazy='dynamic'))

    # Зв'язок з посиланнями (один-до-одного)
    links = db.relationship('MovieLink', backref='movie', cascade="all, delete-orphan", uselist=False)

    # Інші зв'язки
    ratings = db.relationship('Rating', backref='movie', lazy='dynamic', cascade="all, delete-orphan")
    tags = db.relationship('Tag', backref='movie', lazy='dynamic', cascade="all, delete-orphan")
    list_movies = db.relationship('ListMovie', backref='movie', lazy='dynamic', cascade="all, delete-orphan")
    saved_movies = db.relationship('SavedMovie', backref='movie', lazy='dynamic', cascade="all, delete-orphan")

    # Представлення об'єкта
    def __repr__(self):
        return f"<Movie {self.movie_id} {self.title_en}>" # Використовуємо movie_id

# --- Таблиця Жанрів ---
class Genre(db.Model):
    __tablename__ = 'genres'
    id = db.Column(db.Integer, primary_key=True)
    name_en = db.Column(db.String(100), unique=True, nullable=False) # Англійська назва (унікальна)
    name_uk = db.Column(db.String(100), nullable=True)               # Українська назва

# --- Таблиця зв'язку Фільм-Жанр ---
movie_genres = db.Table('movie_genres', db.metadata,
    # !!! ВИКОРИСТОВУЄМО movies.movie_id !!!
    db.Column('movie_id', db.Integer, db.ForeignKey('movies.movie_id', ondelete='CASCADE'), primary_key=True),
    db.Column('genre_id', db.Integer, db.ForeignKey('genres.id', ondelete='CASCADE'), primary_key=True)
)

# --- Таблиця Посилань на фільми (IMDb, TMDb) ---
class MovieLink(db.Model):
    __tablename__ = 'movie_links'
    id = db.Column(db.Integer, primary_key=True)
    # !!! ВИКОРИСТОВУЄМО movies.movie_id !!!
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.movie_id', ondelete='CASCADE'), unique=True, nullable=False)
    imdb_id = db.Column(db.String(20), nullable=True)
    tmdb_id = db.Column(db.Integer, nullable=True)

# --- Таблиця Оцінок фільмів (користувацьких) ---
class Rating(db.Model):
    __tablename__ = 'app_ratings' # Використовуємо нову назву таблиці
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    # !!! ВИКОРИСТОВУЄМО movies.movie_id !!!
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.movie_id', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Float, nullable=False) # Використовуємо 'rating' замість 'score'
    created_at = db.Column(db.DateTime, default=datetime.utcnow) # Змінено з 'timestamp'
    # Унікальне обмеження
    __table_args__ = (UniqueConstraint('user_id', 'movie_id', name='_user_movie_rating_uc'),)

# --- Таблиця Тегів ---
class Tag(db.Model):
    __tablename__ = 'tags'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    # !!! ВИКОРИСТОВУЄМО movies.movie_id !!!
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.movie_id', ondelete='CASCADE'), nullable=False)
    tag = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.Integer, nullable=False) # Зберігаємо як число (як в MovieLens)

# --- Таблиця Списків Користувача ---
# Перейменовано з 'List' для уникнення конфлікту
class MovieList(db.Model):
    __tablename__ = 'movie_lists' # Нова назва таблиці
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(120), nullable=False) # Збільшено довжину, як у вас
    created_at = db.Column(db.DateTime, default=datetime.utcnow) # Змінено з 'created'
    description = db.Column(db.Text, nullable=True) # Додано опис
    is_public = db.Column(db.Boolean, nullable=False, default=False, index=True) # Додано індекс
    # Статистика
    avg_rating = db.Column(db.Float, nullable=True)
    rating_count = db.Column(db.Integer, nullable=False, default=0)
    movie_count = db.Column(db.Integer, nullable=False, default=0)

    # Зв'язки
    owner = db.relationship("User", back_populates="lists")
    list_movies = db.relationship('ListMovie', backref='movie_list', lazy='dynamic', cascade="all, delete-orphan")
    ratings = db.relationship('ListRating', backref='rated_list', lazy='dynamic', cascade="all, delete-orphan")
    subscribers = db.relationship('SavedList', backref='subscribed_list', lazy='dynamic', cascade="all, delete-orphan")

    # Метод to_dict адаптовано
    def to_dict(self):
         return {
            "id":       self.id,
            "name":     self.name,
            "user_id":  self.user_id,
            "created":  self.created_at.isoformat(),
            "movies":   [lm.movie_id for lm in self.list_movies],
            "is_public": self.is_public,
            "avg_rating": self.avg_rating,
            "rating_count": self.rating_count,
            "movie_count": self.movie_count,
         }

# --- Таблиця зв'язку Списку і Фільму ---
class ListMovie(db.Model):
    __tablename__ = 'list_movies'
    id = db.Column(db.Integer, primary_key=True)
    list_id = db.Column(db.Integer, db.ForeignKey('movie_lists.id', ondelete='CASCADE'), nullable=False)
     # !!! ВИКОРИСТОВУЄМО movies.movie_id !!!
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.movie_id', ondelete='CASCADE'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint('list_id', 'movie_id', name='_list_movie_uc'),)

# --- Таблиця Збережених Фільмів (Улюблене) ---
class SavedMovie(db.Model):
    __tablename__ = 'saved_movies'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
     # !!! ВИКОРИСТОВУЄМО movies.movie_id !!!
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.movie_id', ondelete='CASCADE'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint('user_id', 'movie_id', name='_user_saved_movie_uc'),)

# --- Таблиця Оцінок/Відгуків для Списків ---
class ListRating(db.Model):
    __tablename__ = 'list_ratings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    list_id = db.Column(db.Integer, db.ForeignKey('movie_lists.id', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Float, nullable=False)
    review = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    __table_args__ = (UniqueConstraint('user_id', 'list_id', name='_user_list_rating_uc'),)

# --- Таблиця Збережених Списків (Підписки) ---
class SavedList(db.Model):
    __tablename__ = 'saved_lists'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    list_id = db.Column(db.Integer, db.ForeignKey('movie_lists.id', ondelete='CASCADE'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint('user_id', 'list_id', name='_user_saved_list_uc'),)


# === СЛУХАЧІ ПОДІЙ ===
def _execute_update(connection, statement):
    """ Safely execute statement in listener context """
    try:
        connection.execute(statement)
    except Exception as e:
        print(f"[!] Listener Error: {e}")

@event.listens_for(ListRating, 'after_insert')
@event.listens_for(ListRating, 'after_update')
@event.listens_for(ListRating, 'after_delete')
def update_list_rating_stats(mapper, connection, target):
    """Оновлює avg_rating та rating_count у MovieList."""
    list_id = target.list_id
    if list_id:
        movie_list_table = MovieList.__table__
        list_rating_table = ListRating.__table__
        select_stmt = select(
            func.avg(list_rating_table.c.rating).label('avg_r'),
            func.count(list_rating_table.c.id).label('count_r')
        ).where(list_rating_table.c.list_id == list_id)
        result = connection.execute(select_stmt).fetchone()
        update_stmt = movie_list_table.update().\
            where(movie_list_table.c.id == list_id).\
            values(
                avg_rating=result.avg_r if result and result.count_r > 0 else None,
                rating_count=result.count_r if result else 0
            )
        _execute_update(connection, update_stmt)

@event.listens_for(ListMovie, 'after_insert')
@event.listens_for(ListMovie, 'after_delete')
def update_list_movie_count_stats(mapper, connection, target):
    """Оновлює movie_count у MovieList."""
    list_id = target.list_id
    if list_id:
        movie_list_table = MovieList.__table__
        list_movie_table = ListMovie.__table__
        select_stmt = select(func.count(list_movie_table.c.id)).where(list_movie_table.c.list_id == list_id)
        count_val = connection.execute(select_stmt).scalar()
        update_stmt = movie_list_table.update().\
            where(movie_list_table.c.id == list_id).\
            values(movie_count=count_val if count_val is not None else 0)
        _execute_update(connection, update_stmt)