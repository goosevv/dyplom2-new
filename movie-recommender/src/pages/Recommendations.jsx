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
  const [algorithm, setAlgorithm] = useState("hybrid");
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    try {
      if (!query.trim()) return;
      const { data } = await axios.get(`/api/movies/search`, {
        params: { q: query.trim() },
      });
      // data — це масив { movieId, title }
      setSearchResults(
        data.map((item) => ({
          movieId: item.movieId,
          title: item.title,
        }))
      );
    } catch {
      setError("Помилка пошуку. Спробуйте інший запит.");
    } finally {
      setLoading(false);
    }
  };

  // 2) Загрузка рекомендаций
  const handleSelect = async (movie) => {
    setError(null);
    setSelectedMovie(movie);
    setLoading(true);
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
    } finally {
      setLoading(false);
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
      {/* Алгоритм */}
      <Flex justify="flex-end" mb={4}>
        <ButtonGroup size="sm" isAttached variant="outline">
          {["knn", "content", "svd", "hybrid"].map((alg) => (
            <Button
              key={alg}
              isActive={algorithm === alg}
              onClick={() => setAlgorithm(alg)}>
              {alg.toUpperCase()}
            </Button>
          ))}
        </ButtonGroup>
      </Flex>
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
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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

      {/* Сетка карточек или Skeleton */}
      {loading ? (
        <SimpleGrid columns={[1, 2, 3, 4]} spacing={6}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height="350px" borderRadius="md" />
          ))}
        </SimpleGrid>
      ) : (
        <SimpleGrid columns={[1, 2, 3, 4]} spacing={6}>
          {(selectedMovie ? recommendations : searchResults).map((m) => (
            <MovieCard
              key={m.movieId}
              movie={m}
              onClickCard={selectedMovie ? undefined : () => handleSelect(m)}
              showRating={!!selectedMovie}
            />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
