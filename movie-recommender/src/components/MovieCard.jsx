// src/components/MovieCard.jsx
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Box,
  AspectRatio,
  Image,
  Heading,
  Text,
  IconButton,
  Spinner,
  useColorModeValue,
  Flex,
} from "@chakra-ui/react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { LocaleContext } from "../LocaleContext";
import { TMDB_KEY, TMDB_API_BASE, TMDB_IMG_BASE, authHeaders } from "../config";

// Кэш жанров
const genreCache = {};
async function loadGenres(lang) {
  if (genreCache[lang]) return genreCache[lang];
  try {
    const res = await axios.get(`${TMDB_API_BASE}/genre/movie/list`, {
      params: { api_key: TMDB_KEY, language: lang },
    });
    const map = {};
    res.data.genres.forEach((g) => (map[g.id] = g.name));
    genreCache[lang] = map;
    return map;
  } catch {
    return {};
  }
}

export default function MovieCard({ movie, onClickCard }) {
  // ── 1) Хуки ────────────────────────────────
  const { tmdbLang } = useContext(LocaleContext);
  const [details, setDetails] = useState(null);
  const [liked, setLiked] = useState(false);

  // Все useColorModeValue ВЫЗЫВАЕМ до любого return
  const bg = useColorModeValue("white", "gray.700");
  const overlayBg = useColorModeValue(
    "rgba(255,255,255,0.8)",
    "rgba(0,0,0,0.8)"
  );
  const descriptionTextColor = useColorModeValue("gray.800", "white");
  const footerBgColor = useColorModeValue("whiteAlpha.900", "blackAlpha.900");

  // ── 2) Подгружаем детали и лайки ────────────
  useEffect(() => {
    let mounted = true;

    loadGenres(tmdbLang);

    const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    setLiked(favs.includes(movie.movieId));

    const titleNoYear = movie.title.replace(/\s*\(\d{4}\)$/, "");
    const yearMatch = movie.title.match(/\((\d{4})\)$/);
    const params = {
      api_key: TMDB_KEY,
      query: titleNoYear,
      language: tmdbLang,
    };
    if (yearMatch) params.year = yearMatch[1];

    axios
      .get(`${TMDB_API_BASE}/search/movie`, { params })
      .then((r) => mounted && setDetails(r.data.results?.[0] || {}))
      .catch(() => mounted && setDetails({}));

    return () => {
      mounted = false;
    };
  }, [movie.movieId, tmdbLang]);

  // ── 3) Спиннер, пока details=null ───────────
  if (details === null) {
    return (
      <Box maxW="sm" w="100%" textAlign="center" py={6} bg={bg}>
        <Spinner size="lg" />
      </Box>
    );
  }

  // ── 4) Подготовка данных ─────────────────────
  const poster = details.poster_path
    ? `${TMDB_IMG_BASE}${details.poster_path}`
    : "/placeholder.png";
  const year = (details.release_date || "").slice(0, 4);
  const ids = details.genre_ids || details.genres?.map((g) => g.id) || [];
  const genres = ids
    .map((id) => genreCache[tmdbLang]?.[id])
    .filter(Boolean)
    .join(", ");
  const overview = details.overview || "Описание отсутствует";

  // ── 5) Лайк/дизлайк ─────────────────────────
  const toggleLike = async (e) => {
    e.stopPropagation();
    try {
      if (liked) {
        await axios.delete(`/recommend/user/favorites`, {
          ...authHeaders(),
          data: { movieId: movie.movieId },
        });
      } else {
        await axios.post(
          `/recommend/user/favorites`,
          { movieId: movie.movieId },
          authHeaders()
        );
      }
      const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
      const updated = liked
        ? favs.filter((id) => id !== movie.movieId)
        : [...favs, movie.movieId];
      localStorage.setItem("favorites", JSON.stringify(updated));
      setLiked(!liked);
    } catch {}
  };

  // ── 6) Основной рендер ───────────────────────
  return (
    <Box
      pos="relative"
      maxW="sm"
      w="100%"
      bg={bg}
      boxShadow="md"
      borderRadius="md"
      overflow="hidden"
      cursor={onClickCard ? "pointer" : "default"}
      onClick={onClickCard}
      role={onClickCard ? "group" : undefined}
      transition="transform .2s"
      _hover={{
        transform: onClickCard ? "scale(1.05)" : undefined,
        boxShadow: onClickCard ? "lg" : undefined,
      }}>
      <AspectRatio ratio={2 / 3}>
        <Image src={poster} alt={details.title} objectFit="cover" />
      </AspectRatio>

      <Box p={2} bg={bg}>
        <Heading as="h5" size="md" isTruncated>
          {details.title}
        </Heading>
      </Box>

      {/* Оверлей */}
      <Box
        pos="absolute"
        inset="0"
        bg={overlayBg}
        opacity="0"
        transition="opacity .3s"
        _groupHover={{ opacity: 1 }}
        display="flex"
        flexDir="column"
        justify="space-between">
        <Box p={4} overflowY="auto">
          <Text fontSize="sm" color={descriptionTextColor}>
            {overview}
          </Text>
        </Box>

        <Flex p={3} bg={footerBgColor} align="center" justify="space-between">
        <Text fontSize="xs" color="gray.600" isTruncated maxW="70%">
            {year}
            {genres && ` • ${genres}`}
          </Text>
          {showRating && (
            <Text fontSize="sm" fontWeight="bold"></Text>
            {movie.score?.toFixed(2)}
            </Text>
          )}
          <IconButton
            aria-label="Нравится"
            icon={liked ? <FaHeart /> : <FaRegHeart />}
            onClick={toggleLike}
            variant="solid"
            colorScheme="red"
            size="sm"
          />
        </Flex>
      </Box>
    </Box>
  );
}
