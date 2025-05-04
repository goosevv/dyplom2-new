# load_movielens_uk.py (Версія БЕЗ Flask-Migrate, ВИКОРИСТОВУЄ drop_all/create_all)

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import sessionmaker
from collections import Counter
import os
import time
from flask import Flask
from werkzeug.security import generate_password_hash

# --- КОНФІГУРАЦІЯ ---
try:
    from config import Config
    MYSQL_URI = Config.SQLALCHEMY_DATABASE_URI
except ImportError:
    print("[!!!] Не вдалося імпортувати MYSQL_URI з config.py.")
    print("    Перевірте шлях та наявність файлу config.py та класу Config у ньому.")
    exit()
except AttributeError:
    print("[!!!] Не вдалося знайти SQLALCHEMY_DATABASE_URI у класі Config в config.py.")
    exit()

# Шляхи до ваших даних (!!! ЗАМІНІТЬ НА ВАШІ РЕАЛЬНІ ШЛЯХИ !!!)
BASE_DATA_DIR = "D:/dyplom2/server/data/ml-latest" # <--- ВАШ ШЛЯХ ДО ПАПКИ З ДАНИМИ
MOVIES_CSV = os.path.join(BASE_DATA_DIR, "movies_uk.csv") # <--- Ваш збагачений український файл
RATINGS_CSV = os.path.join(BASE_DATA_DIR, "ratings.csv") # <--- Файл рейтингів
# ----------------------------------------------------

# Імпортуємо ВСІ моделі з єдиного models/models.py
try:
    # Використовуємо шлях імпорту models.models
    from models.models import (
        db, Movie, MovieLink, Rating, Tag, Genre, movie_genres, User, Role,
        MovieList, ListMovie, SavedMovie, ListRating, SavedList
    )
except ImportError as e:
     print(f"[!!!] Не вдалося імпортувати моделі з models.models: {e}")
     print("    Переконайтеся, що файл models.py існує в папці models/")
     print("    та що всі залежності встановлені.")
     exit()

# --- КАРТА ЖАНРІВ (EN -> UK) ---
# !!! ПЕРЕВІРТЕ ТА СКОРИГУЙТЕ ПЕРЕКЛАДИ !!!
CANONICAL_EN_UK_GENRE_MAP = {
    'Adventure': 'пригоди', 'Animation': 'анімація', 'Children': 'дитячий',
    'Comedy': 'комедія', 'Fantasy': 'фентезі', 'Romance': 'мелодрама',
    'Drama': 'драма', 'Action': 'бойовик', 'Crime': 'кримінал',
    'Thriller': 'трилер', 'Horror': 'жахи', 'Mystery': 'детектив',
    'Sci-Fi': 'фантастика', 'War': 'військовий', 'Musical': 'мюзикл',
    'Documentary': 'документальний', 'Western': 'вестерн',
    'Film-Noir': 'фільм-нуар', 'IMAX': 'IMAX', '(no genres listed)': None
}
# -----------------------------

# Створення мінімального Flask додатку для контексту SQLAlchemy
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = MYSQL_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
try:
    db.init_app(app)
except Exception as init_err:
    print(f"[*] Попередження: Не вдалося виконати db.init_app(app). Можливо, 'db' вже ініціалізовано.")

def load_data():
    start_time = time.time()
    engine = create_engine(MYSQL_URI)
    try:
        connection_test = engine.connect()
        connection_test.close()
        print("[+] З'єднання з базою даних успішне.")
    except OperationalError as oe:
        print(f"[!!!] ПОМИЛКА ПІДКЛЮЧЕННЯ ДО БД: {oe}")
        print("    Перевірте рядок підключення MYSQL_URI у config.py та доступність сервера БД.")
        return
    except Exception as e:
        print(f"[!!!] Невідома помилка підключення до БД: {e}")
        return

    Session = sessionmaker(bind=engine)
    session = Session()

    print("[*] Читання CSV файлів...")
    try:
        movies_df_raw = pd.read_csv(
            MOVIES_CSV, dtype={'movieId': 'int64', 'imdbId': 'str', 'tmdbId': 'Int64', 'year': 'Int64'}
        )
        ratings_df_raw = pd.read_csv(RATINGS_CSV)
        print("[+] CSV файли успішно прочитано.")
        print(f"    Фільми (raw): {len(movies_df_raw)} рядків")
        print(f"    Рейтинги (raw): {len(ratings_df_raw)} рядків")
    except FileNotFoundError as e:
        print(f"[!!!] ПОМИЛКА: Не знайдено CSV файл - {e}")
        print(f"    Перевірте шлях: {os.path.dirname(MOVIES_CSV)}")
        session.close()
        return
    except Exception as e:
        print(f"[!!!] ПОМИЛКА читання CSV: {e}")
        session.close()
        return

    print("[*] Фільтрація фільмів та рейтингів (мін. 5 рейтингів на фільм)...")
    if 'movieId' not in ratings_df_raw.columns:
        print("[!!!] ПОМИЛКА: Колонка 'movieId' відсутня у файлі ratings.csv")
        session.close()
        return
    if 'movieId' not in movies_df_raw.columns:
        print(f"[!!!] ПОМИЛКА: Колонка 'movieId' відсутня у файлі {MOVIES_CSV}")
        session.close()
        return

    ratings_count = ratings_df_raw.groupby('movieId').size().reset_index(name='count')
    popular_movie_ids = set(ratings_count[ratings_count['count'] >= 5]['movieId'])
    movies_df = movies_df_raw[movies_df_raw['movieId'].isin(popular_movie_ids)].copy()
    ratings_df = ratings_df_raw[ratings_df_raw['movieId'].isin(popular_movie_ids)].copy()

    print(f"[*] Відфільтровано до {len(popular_movie_ids)} популярних фільмів.")
    print(f"[*] Використовується {len(movies_df)} рядків з даних про фільми для завантаження.")
    active_user_ids = set(ratings_df['userId'].unique())
    print(f"[*] Знайдено {len(active_user_ids)} активних користувачів.")


    with app.app_context():
        print("\n[*] Підготовка бази даних (DROP ALL -> CREATE ALL)...")
        # !!! ЗАПИТ НА ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ ДАНИХ !!!
        proceed = input("    !!! УВАГА !!! Цей скрипт видалить ВСІ існуючі таблиці та дані і створить їх заново! Продовжити? (yes/no): ")
        if proceed.lower() != 'yes':
            print("[-] Завантаження скасовано користувачем.")
            session.close()
            return

# Замість попереднього блоку try...except для drop/create:
        try:
            print("    - Операції з таблицями бази даних...")
            with engine.connect() as connection:
                # Починаємо транзакцію для всього процесу видалення/створення
                with connection.begin():
                    print("      - Тимчасове вимкнення перевірки зовнішніх ключів...")
                    connection.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))

                    print("      - Видалення всіх таблиць (якщо існують)...")
                    # Передаємо з'єднання напряму в drop_all/create_all
                    db.metadata.drop_all(bind=connection, checkfirst=True)

                    print("      - Створення всіх таблиць...")
                    db.metadata.create_all(bind=connection)

                    print("      - Увімкнення перевірки зовнішніх ключів...")
                    connection.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
                    # Транзакція автоматично завершиться (commit) тут
            print("[+] Таблиці успішно видалено та створено.")
        except OperationalError as oe:
             print(f"[!!!] ПОМИЛКА Операції з БД: {oe}")
             session.close() # Закриваємо сесію SQLAlchemy, якщо вона ще відкрита
             return
        except Exception as e:
            print(f"[!!!] ПОМИЛКА при видаленні/створенні таблиць: {e}")
            session.close() # Закриваємо сесію SQLAlchemy
            return
        # ---> Кінець оновленого блоку <---

        try:
            # === 1. Завантаження Ролей ===
            print("\n[*] Завантаження ролей...")
            role_cache = {}
            # Додаємо ролі, якщо їх немає (drop_all їх видалив)
            admin_role = Role(name="admin")
            user_role = Role(name="user")
            session.add_all([admin_role, user_role])
            session.commit()
            print("[+] Ролі завантажено.")
            role_cache['admin'] = admin_role
            role_cache['user'] = user_role
            user_role_obj = role_cache.get('user')
            if not user_role_obj: raise Exception("Не вдалося створити/знайти роль 'user'") # Критична помилка

            # === 2. Завантаження Жанрів ===
            print("\n[*] Завантаження жанрів (з українською картою EN->UK)...")
            genre_cache_en_normalized = {}
            all_genres_en_normalized_in_df = set()
            for genres_str in movies_df['genres'].dropna().unique():
                 if genres_str.lower() != '(no genres listed)':
                      all_genres_en_normalized_in_df.update(g.strip().title() for g in genres_str.split('|') if g.strip())
            print(f"    - Знайдено {len(all_genres_en_normalized_in_df)} унікальних нормалізованих EN жанрів.")

            genres_to_add = []
            for g_name_en_normalized in all_genres_en_normalized_in_df:
                g_name_uk = CANONICAL_EN_UK_GENRE_MAP.get(g_name_en_normalized)
                if g_name_uk is None and g_name_en_normalized != '(No Genres Listed)':
                    print(f"    [Увага] Не знайдено українського перекладу для жанру: '{g_name_en_normalized}'. Поле name_uk буде NULL.")
                genre_obj = Genre(name_en=g_name_en_normalized, name_uk=g_name_uk)
                genres_to_add.append(genre_obj)
                genre_cache_en_normalized[g_name_en_normalized] = genre_obj # Додаємо в кеш одразу

            if genres_to_add:
                print(f"    - Додавання {len(genres_to_add)} жанрів до БД...")
                session.add_all(genres_to_add)
                session.commit() # Коммітимо жанри
                print(f"[+] Додано {len(genres_to_add)} жанрів.")
                # Оновлюємо кеш з об'єктами, що мають ID
                genre_cache_en_normalized = {g.name_en.title(): g for g in session.query(Genre).all()}
            else:
                 print("[-] Жанрів для додавання немає.")
            print(f"    - Розмір кешу жанрів (нормалізований): {len(genre_cache_en_normalized)}")


            # === 3. Завантаження Фільмів ===
            print("\n[*] Завантаження фільмів...")
            movies_to_commit_objs = []
            movie_objects_cache = {} # Цей кеш використовується для зв'язків
            for _, row in movies_df.iterrows():
                 movie_id = int(row['movieId'])
                 title_en = row['title']; title_uk = row.get('title_uk') if pd.notna(row.get('title_uk')) else title_en
                 year_val = row.get('year'); year = int(year_val) if pd.notna(year_val) else None
                 studio = row.get('studio') if pd.notna(row.get('studio')) else None
                 genres_original_str = row.get('genres') if pd.notna(row.get('genres')) else None
                 # !!! ВИКОРИСТОВУЄМО movie_id ЯК ІМ'Я АРГУМЕНТУ !!!
                 movie = Movie(
                     movie_id=movie_id, # <--- Використовуємо ім'я колонки моделі
                     title_en=title_en, title_uk=title_uk, year=year,
                     studio=studio, genres_str=genres_original_str
                     # popularity поки не завантажуємо
                 )
                 movies_to_commit_objs.append(movie)
                 movie_objects_cache[movie_id] = movie

            if movies_to_commit_objs:
                 print(f"    - Підготовка {len(movies_to_commit_objs)} об'єктів фільмів...")
                 session.add_all(movies_to_commit_objs)
                 session.flush() # Потрібно, щоб об'єкти були в сесії для зв'язків
                 print(f"[+] Додано {len(movies_to_commit_objs)} фільмів (перед коммітом).")

            # === 4. Завантаження Зв'язків Фільм-Жанр ===
            print("\n[*] Зв'язування фільмів та жанрів...")
            link_count = 0
            processed_movie_ids_linking = set()
            for _, row in movies_df.iterrows():
                  movie_id = int(row['movieId'])
                  if movie_id in processed_movie_ids_linking: continue
                  processed_movie_ids_linking.add(movie_id)
                  movie = movie_objects_cache.get(movie_id) # Беремо з кешу сесії
                  if not movie: continue
                  genres_en_str = row['genres']
                  if pd.notna(genres_en_str) and genres_en_str.lower() != '(no genres listed)':
                      for g_name_en in genres_en_str.split('|'):
                          g_clean_en_normalized = g_name_en.strip().title()
                          if g_clean_en_normalized:
                              genre = genre_cache_en_normalized.get(g_clean_en_normalized)
                              if genre:
                                  if genre not in movie.genres:
                                      movie.genres.append(genre)
                                      link_count += 1
            print(f"    - Підготовлено {link_count} зв'язків фільм-жанр...")
            session.commit() # Коммітимо фільми і зв'язки разом
            print(f"[+] Завантажено фільми та {link_count} зв'язків фільм-жанр.")
            # Оновлюємо кеш об'єктів фільмів тими, що точно є в БД
            movie_objects_cache = {m.movie_id: m for m in session.query(Movie).filter(Movie.movie_id.in_(list(movie_objects_cache.keys()))).all()}

            # === 5. Завантаження Посилань ===
            print("\n[*] Завантаження посилань на фільми (IMDb, TMDB)...")
            links_to_commit = []
            for _, row in movies_df.iterrows():
                 movie_id = int(row['movieId'])
                 if movie_id in movie_objects_cache:
                    imdb_id_val = row.get('imdbId'); tmdb_id_val = row.get('tmdbId'); imdb_id_str = None
                    if pd.notna(imdb_id_val):
                        try: imdb_id_str = str(int(float(imdb_id_val)))
                        except (ValueError, TypeError): imdb_id_str = str(imdb_id_val).strip()
                    tmdb_id_int = int(tmdb_id_val) if pd.notna(tmdb_id_val) else None
                    if imdb_id_str or tmdb_id_int is not None:
                        links_to_commit.append(MovieLink(movie_id=movie_id, imdb_id=imdb_id_str, tmdb_id=tmdb_id_int))
            if links_to_commit:
                 print(f"    - Підготовка {len(links_to_commit)} об'єктів посилань...")
                 session.bulk_save_objects(links_to_commit); session.commit()
                 print(f"[+] {len(links_to_commit)} посилань на фільми завантажено.")
            else:
                 print("[-] Нових дійсних посилань для завантаження не знайдено.")

            # === 6. Завантаження Користувачів ===
            print("\n[*] Завантаження користувачів...")
            users_to_commit = []
            default_password = generate_password_hash("password123")
            new_user_count = 0
            user_role_id = user_role_obj.id
            for user_id in active_user_ids:
                 user_id_int = int(user_id)
                 # Не перевіряємо existing_user_ids, бо таблиця порожня
                 users_to_commit.append(User(id=user_id_int, email=f"user{user_id_int}@example.com", password=default_password, name=f"User {user_id_int}", role_id=user_role_id))
                 new_user_count += 1
                 if len(users_to_commit) >= 5000:
                     print(f"    - Комміт {len(users_to_commit)} користувачів...")
                     session.bulk_save_objects(users_to_commit); session.commit(); users_to_commit = []
            if users_to_commit:
                 print(f"    - Комміт залишку ({len(users_to_commit)}) користувачів...")
                 session.bulk_save_objects(users_to_commit); session.commit()
            print(f"[+] {new_user_count} користувачів завантажено.")

            # === 7. Завантаження Рейтингів Фільмів ===
            print("\n[*] Завантаження рейтингів фільмів...")
            ratings_to_commit = []
            added_count = 0
            movie_ids_in_db = set(movie_objects_cache.keys()) # ID фільмів, які ми завантажили

            for _, row in ratings_df.iterrows():
                 user_id = int(row['userId'])
                 movie_id = int(row['movieId'])
                 # Перевіряємо, чи користувач активний і фільм був завантажений
                 if user_id in active_user_ids and movie_id in movie_ids_in_db:
                     ratings_to_commit.append({'user_id': user_id, 'movie_id': movie_id, 'rating': float(row['rating'])})
                     added_count += 1
                 if len(ratings_to_commit) >= 10000:
                     print(f"    - Комміт {len(ratings_to_commit)} рейтингів...")
                     session.bulk_insert_mappings(Rating, ratings_to_commit); session.commit(); ratings_to_commit = []
            if ratings_to_commit:
                 print(f"    - Комміт залишку ({len(ratings_to_commit)}) рейтингів...")
                 session.bulk_insert_mappings(Rating, ratings_to_commit); session.commit()
            print(f"[+] {added_count} рейтингів завантажено.")

            # === 8. Завантаження Тегів - ПРОПУЩЕНО ===
            print("\n[*] Завантаження тегів пропущено.")

            print("\n[+] Завантаження даних успішно завершено.")

        except IntegrityError as ie:
            session.rollback()
            print(f"[!!!] ПОМИЛКА ЦІЛІСНОСТІ БД: {ie}")
            orig_error = getattr(ie, 'orig', None); print(f"    - Оригінальна помилка БД: {orig_error}")
            print(f"    - Параметри запиту: {getattr(ie, 'params', 'N/A')}")
        except Exception as e:
            session.rollback()
            print(f"[!!!] НЕПЕРЕДБАЧЕНА ПОМИЛКА під час завантаження даних: {e}")
            import traceback
            traceback.print_exc()
        finally:
            session.close()
            end_time = time.time()
            print(f"\n[*] Загальний час завантаження: {end_time - start_time:.2f} секунд.")

if __name__ == '__main__':
    print("=== Запуск скрипта завантаження даних (БЕЗ Flask-Migrate) ===")
    print(f"Використовується директорія MovieLens: {BASE_DATA_DIR}")
    print(f"Використовується CSV фільмів: {MOVIES_CSV}")
    print(f"Використовується CSV рейтингів: {RATINGS_CSV}")
    if not os.path.exists(MOVIES_CSV):
         print(f"\n[!!!] КРИТИЧНА ПОМИЛКА: Файл фільмів '{MOVIES_CSV}' не знайдено!")
    elif not os.path.exists(RATINGS_CSV):
         print(f"\n[!!!] КРИТИЧНА ПОМИЛКА: Файл рейтингів '{RATINGS_CSV}' не знайдено!")
    else:
         load_data()
    print("=== Скрипт завантаження даних завершив роботу ===")