// src/pages/Lists.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { TMDB_KEY, TMDB_IMG_BASE, API_BASE } from "../config";

export default function Lists() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);

  // Чистим заголовок (как в Recommendations)
  const cleanTitle = (t) =>
    t.replace(/\s*\(\d{4}\)$/, "").replace(/^(.+),\s*(The|A|An)$/i, "$2 $1");

  // Fetch favorites + постеры
  useEffect(() => {
    const fetchFav = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API_BASE}/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // дополняем постерами из TMDB
        const withPosters = await Promise.all(
          data.map(async (f) => {
            try {
              const resp = await axios.get(
                "https://api.themoviedb.org/3/search/movie",
                {
                  params: {
                    api_key: TMDB_KEY,
                    query: cleanTitle(f.title),
                  },
                }
              );
              const arr = resp.data.results;
              const poster = arr.length
                ? TMDB_IMG_BASE + arr[0].poster_path
                : "/placeholder.png";
              return { ...f, poster };
            } catch {
              return { ...f, poster: "/placeholder.png" };
            }
          })
        );
        setFavorites(withPosters);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFav();
  }, []);

  const onUnlike = async (movieId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/like/${movieId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites((prev) => prev.filter((f) => f.movieId !== movieId));
    } catch (err) {
      console.error(err);
      alert("Не вдалося прибрати з Favorites");
    }
  };

  if (loading) return <p>Завантаження списку…</p>;
  if (!favorites.length) return <p>У вас поки немає Favorites.</p>;

  return (
    <div className="container mt-4">
      <h2>Ваші Favorites</h2>
      <div className="row">
        {favorites.map((f) => (
          <div key={f.movieId} className="col-md-3 mb-4">
            <div className="card h-100 position-relative">
              <img
                src={f.poster}
                className="card-img-top"
                style={{ height: 200, objectFit: "cover" }}
              />
              <div className="card-body">
                <h6 className="card-title">{f.title}</h6>
              </div>
              <button
                className="btn btn-outline-danger btn-sm"
                style={{ position: "absolute", top: 10, right: 10 }}
                onClick={() => onUnlike(f.movieId)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
