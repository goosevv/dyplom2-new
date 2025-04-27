// src/pages/Recommendations.jsx
import React, { useState, useContext } from "react";
import axios from "axios";
import MovieCard from "../components/MovieCard";
import {
  Box,
  Button,
  Input,
  SimpleGrid,
  VStack,
  Alert,
  AlertIcon,
  Heading,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { LocaleContext } from "../LocaleContext";
import { TMDB_KEY, TMDB_API_BASE } from "../config";

export default function Recommendations() {
  const { tmdbLang } = useContext(LocaleContext);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [error, setError] = useState(null);

  const bg = useColorModeValue("gray.50", "gray.800");

  // 1) Поиск по TMDb
  const handleSearch = async () => {
    if (!query.trim()) return;
    setError(null);
    setSelectedMovie(null);
    setRecommendations([]);
    try {
      if (!query.trim()) return;
      const { data } = await axios.get(`/api/movies/search`, {
        params: { q: query.trim() },
      });
      setSearchResults(
        data.results.map((item) => ({
          movieId: item.id,
          title: `${item.title}${
            item.release_date ? ` (${item.release_date.slice(0, 4)})` : ""
          }`,
        }))
      );
    } catch {
      setError("Помилка пошуку. Спробуйте інший запит.");
    }
  };

  // 2) Загрузка рекомендаций
  const handleSelect = async (movie) => {
    setError(null);
    setSelectedMovie(movie);
    try {
      const { data } = await axios.get(
        `/api/recommend/movie/${movie.movieId}`,
        { params: { n: 10 } }
      );

      // Надёжно достаём массив из любого ответа:
      let recs = [];
      if (Array.isArray(data)) {
        recs = data;
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.recommendations)) recs = data.recommendations;
        else if (Array.isArray(data.results)) recs = data.results;
      }
      setRecommendations(recs);
    } catch {
      setError("Не вдалося завантажити рекомендації.");
    }
  };

  // 3) Сброс в режим поиска
  const reset = () => {
    setError(null);
    setSelectedMovie(null);
    setRecommendations([]);
    setSearchResults([]);
    setQuery("");
  };

  return (
    <Box bg={bg} minH="100vh" p={4}>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon /> {error}
        </Alert>
      )}

      {/* Форма поиска */}
      {!selectedMovie && (
        <VStack spacing={4} mb={6}>
          <Box display="flex" w="100%">
            <Input
              placeholder="Введіть назву фільму"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              mr={2}
            />
            <Button colorScheme="blue" onClick={handleSearch}>
              Знайти
            </Button>
          </Box>
        </VStack>
      )}

      {/* Кнопка сброса */}
      {selectedMovie && (
        <Box mb={6}>
          <Button onClick={reset}>Повернутись до пошуку</Button>
        </Box>
      )}

      {/* Заголовок */}
      {selectedMovie ? (
        <Heading size="lg" mb={4}>
          Рекомендації для “{selectedMovie.title}”
        </Heading>
      ) : (
        searchResults.length > 0 && (
          <Heading size="lg" mb={4}>
            Результати пошуку
          </Heading>
        )
      )}

      {/* Если были рекомендации, показываем их */}
      {selectedMovie && recommendations.length === 0 && (
        <Text>Немає рекомендацій за цим фільмом.</Text>
      )}

      {/* Сетка карточек */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
        {selectedMovie
          ? recommendations.map((m) => (
              <Box key={m.movieId}>
                <MovieCard movie={m} />
                <Text textAlign="center" mt={2} fontSize="sm" color="gray.500">
                  Рейтинг: {m.score?.toFixed(2) ?? "–"}
                </Text>
              </Box>
            ))
          : searchResults.map((m) => (
              <MovieCard
                key={m.movieId}
                movie={m}
                onClickCard={() => handleSelect(m)}
              />
            ))}
      </SimpleGrid>
    </Box>
  );
}
