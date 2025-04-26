// src/pages/Recommendations.jsx
import React, { useState } from "react";
import axios from "axios";
import { API_BASE, TMDB_KEY, TMDB_IMG_BASE } from "../config";

function formatTitle(t) {
  // Убираем год в скобках и переводим "Name, The" → "The Name"
  return t
    .replace(/\s*\(\d{4}\)$/, "")
    .replace(/^(.+),\s*(The|A|An)$/i, "$2 $1");
}

export default function Recommendations() {
  const [query, setQuery]             = useState("");
  const [movies, setMovies]           = useState([]); // результаты поиска
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [recs, setRecs]               = useState([]); // рекомендации
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRecs, setLoadingRecs]     = useState(false);
  const [error, setError]             = useState("");

  // 1) Поиск по вашему бэку + дозапрос постеров
  const handleSearch = async () => {
    if (!query.trim()) return;
    setError("");
    setLoadingSearch(true);
    setSelectedMovie(null);
    setRecs([]);

    try {
      const { data } = await axios.get(
        `${API_BASE}/search?q=${encodeURIComponent(query)}`
      );
      // дополняем каждый фильм poster_path и tmdb_id
      const withPosters = await Promise.all(
        data.map(async (m) => {
          const clean = formatTitle(m.title);
          try {
            const resp = await axios.get(
              "https://api.themoviedb.org/3/search/movie",
              {
                params: {
                  api_key: TMDB_KEY,
                  query: clean,
                  language: "uk-UA",
                },
              }
            );
            const first = resp.data.results[0] || {};
            return {
              ...m,
              poster_path: first.poster_path || null,
              tmdb_id: first.id || null,
            };
          } catch {
            return { ...m, poster_path: null, tmdb_id: null };
          }
        })
      );
      setMovies(withPosters);
    } catch (e) {
      console.error(e);
      setError("Не вдалося отримати список фільмів.");
    } finally {
      setLoadingSearch(false);
    }
  };

  // 2) По клику — запрос рекомендаций и сохранение выбранного фильма
  const handleRecommend = async (movie) => {
    setError("");
    setLoadingRecs(true);
    setSelectedMovie(movie);

    try {
      const { data: rawRecs } = await axios.get(
        `${API_BASE}/recommend/movie/${movie.movieId}`
      );
      // дозапрос деталей в TMDb (poster, overview, year, genres)
      const detailed = await Promise.all(
        rawRecs.map(async (r) => {
          const clean = formatTitle(r.title);
          try {
            // ищем по названию
            const resp = await axios.get(
              "https://api.themoviedb.org/3/search/movie",
              {
                params: {
                  api_key: TMDB_KEY,
                  query: clean,
                  language: "uk-UA",
                },
              }
            );
            const info = resp.data.results[0] || {};
            return {
              ...r,
              poster_path: info.poster_path || null,
              overview:    info.overview || "",
              release_date: info.release_date || "",
              // тут можно ещё genre_ids перевести в имена, если нужно
            };
          } catch {
            return { ...r, poster_path: null, overview: "", release_date: "" };
          }
        })
      );
      setRecs(detailed);
    } catch (e) {
      console.error(e);
      setError("Не вдалося отримати рекомендації.");
    } finally {
      setLoadingRecs(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>🔍 Знайдіть фільм</h2>

      <div className="input-group mb-4">
        <input
          className="form-control"
          placeholder="Введіть назву фільму..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={loadingSearch}
        >
          {loadingSearch ? "⏳ Пошук..." : "Пошук"}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Список найденных фильмов */}
      <div className="row g-3 mb-5">
        {movies.map((m) => (
          <div className="col-6 col-md-4 col-lg-3" key={m.movieId}>
            <div
              className="card h-100"
              style={{ cursor: "pointer" }}
              onClick={() => handleRecommend(m)}
            >
              <img
                src={
                  m.poster_path
                    ? `${TMDB_IMG_BASE}/w200${m.poster_path}`
                    : "/placeholder.png"
                }
                className="card-img-top"
                alt={m.title}
              />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title" style={{ fontSize: "1rem" }}>
                  {formatTitle(m.title)} {m.title.match(/\(\d{4}\)$/)?.[0] || ""}
                </h5>
                <button className="btn btn-outline-secondary btn-sm mt-auto">
                  Recommend!
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Рекомендации */}
      {loadingRecs && <p>Завантажуємо рекомендації…</p>}
      {!loadingRecs && selectedMovie && recs.length > 0 && (
        <>
          <h3>
            Рекомендації для «{formatTitle(selectedMovie.title)}{" "}
            {selectedMovie.title.match(/\(\d{4}\)$/)?.[0] || ""}»
          </h3>
          <div className="row g-4 mt-3">
            {recs.map((f) => (
              <div className="col-6 col-md-4 col-lg-3" key={f.movieId}>
                <div className="card h-100">
                  <img
                    src={
                      f.poster_path
                        ? `${TMDB_IMG_BASE}/w300${f.poster_path}`
                        : "/placeholder.png"
                    }
                    className="card-img-top"
                    alt={f.title}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title" style={{ fontSize: "1rem" }}>
                      {formatTitle(f.title)}{" "}
                      {f.title.match(/\(\d{4}\)$/)?.[0] || ""}
                    </h5>
                    <p className="mb-1 text-muted">
                      {f.release_date?.slice(0, 4)}
                    </p>
                    <p style={{ fontSize: "0.9rem", flexGrow: 1 }}>
                      {f.overview?.slice(0, 100)}…
                    </p>
                    <a
                      href={`https://www.themoviedb.org/movie/${f.movieId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-secondary btn-sm mt-auto"
                    >
                      Open TMDb
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
