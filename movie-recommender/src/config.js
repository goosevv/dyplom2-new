// src/config.js
export const TMDB_KEY = "11c77e7e912d89b40d8920eb43d1d057";
export const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w200";
export const API_BASE = "http://localhost:5000";
export const TMDB_API_BASE = "https://api.themoviedb.org/3";
export const API = "/api";
export const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
