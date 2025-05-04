"""
Колонки в выходе:
    movieId,title,genres,year,imdbId,tmdbId,title_uk,genres_uk,studio
"""

from __future__ import annotations

import csv
import logging
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

import pandas as pd
import requests

# ----------- логирование ----------------------------------------------------
logging.basicConfig(
    format="%(asctime)s  %(levelname)-8s %(message)s",
    datefmt="%H:%M:%S",
    level=logging.INFO,
)
log = logging.getLogger(__name__)

# ----------- пути к файлам ---------------------------------------------------
BASE_DIR   = Path(r"D:/dyplom2/server/data/ml-latest")
MOVIES_CSV = BASE_DIR / "movies.csv"
LINKS_CSV  = BASE_DIR / "links.csv"
OUT_CSV    = BASE_DIR / "movies_uk.csv"

# ----------- TMDb API-ключ ---------------------------------------------------
TMDB_KEY = os.getenv("TMDB_API_KEY") or "11c77e7e912d89b40d8920eb43d1d057"
if not TMDB_KEY or len(TMDB_KEY) != 32:
    sys.exit("TMDB_API_KEY не указан или неверный (ожидается 32-символьная строка)")

# ----------- вспомогательные функции ----------------------------------------
YEAR_RE = re.compile(r"\((\d{4})\)\s*$")


def extract_year(title: str) -> int | None:
    m = YEAR_RE.search(title)
    return int(m.group(1)) if m else None


def clean_title(title: str) -> str:
    """убирает год, внешние кавычки, «, The/A/An»"""
    t = YEAR_RE.sub("", title).strip().strip('"')
    if "," in t:
        parts = [p.strip() for p in t.split(",")]
        if len(parts) == 2 and parts[1].lower() in {"the", "a", "an"}:
            t = f"{parts[1]} {parts[0]}"
    return t


def tmdb_uk_meta(tmdb_id: int, max_retries: int = 3, delay: float = 0.25) -> dict[str, Any]:
    url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"
    params = {"api_key": TMDB_KEY, "language": "uk-UA"} # Новая строка

    for attempt in range(1, max_retries + 1):
        try:
            r = requests.get(url, params=params, timeout=10)

            if r.status_code == 404:
                log.warning(" - TMDb 404 (нет фильма)")
                return {}
            if r.status_code == 401:
                log.error(" - 401 Unauthorized. Проверьте API-ключ!")
                sys.exit(1)
            if r.status_code == 429:
                wait = int(r.headers.get("Retry-After", 2))
                log.warning(" - 429 Too Many Requests. ждём %s с…", wait)
                time.sleep(wait)
                continue

            r.raise_for_status()
            time.sleep(delay)
            return r.json()

        except requests.RequestException as e:
            log.error(" - попытка %s/%s: %s", attempt, max_retries, e)
            time.sleep(2 * attempt)

    return {}

# ----------- основной процесс ----------------------------------------------
def main() -> None:
    log.info("Читаем исходные CSV …")

    movies = pd.read_csv(MOVIES_CSV)
    links  = pd.read_csv(LINKS_CSV, dtype={"imdbId": str, "tmdbId": str})

    log.info("Извлекаем год и очищаем title")
    movies["year"]  = movies["title"].apply(extract_year).astype("Int64")
    movies["title"] = movies["title"].apply(clean_title)

    log.info("Объединяем с links.csv")
    movies = movies.merge(links, on="movieId", how="left")

    out_columns = [
        "movieId",
        "title",
        "genres",
        "year",
        "imdbId",
        "tmdbId",
        "title_uk",
        "genres_uk",
        "studio",
    ]

    log.info("Открываем выходной файл: %s", OUT_CSV)
    with OUT_CSV.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=out_columns, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()

        total = len(movies)
        log.info("Запрашиваем TMDb для %d фильмов", total)

        for idx, row in movies.iterrows():
            movie_id = row["movieId"]
            tmdb_raw = row["tmdbId"]
            imdb_raw = row["imdbId"]

            log.info("[%5d/%d] movieId=%s  tmdbId=%s  title='%s'",
                     idx + 1, total, movie_id, tmdb_raw, row["title"])

            out_row = {
                "movieId": movie_id,
                "title":   row["title"],
                "genres":  row["genres"],
                "year":    (int(row["year"]) if pd.notna(row["year"]) else None),
                "imdbId":  imdb_raw if pd.notna(imdb_raw) else None,
                "tmdbId":  tmdb_raw if pd.notna(tmdb_raw) else None,
                "title_uk":  None,
                "genres_uk": None,
                "studio":    None,
            }

            if pd.notna(tmdb_raw):
                meta = tmdb_uk_meta(int(tmdb_raw))
                out_row["title_uk"]  = meta.get("title")
                out_row["genres_uk"] = (
                    "|".join(g["name"] for g in meta.get("genres", [])) or None
                )
                prod = meta.get("production_companies", [])
                out_row["studio"] = prod[0]["name"] if prod else None
            else:
                log.warning(" - нет tmdbId, пропуск")

            writer.writerow(out_row)

            # сбрасываем буфер каждые 100 строк
            if (idx + 1) % 100 == 0:
                fh.flush()

    log.info("Готово!  %d строк записано.", total)


if __name__ == "__main__":
    main()
