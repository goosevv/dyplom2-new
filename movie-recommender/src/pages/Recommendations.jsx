// src/pages/Recommendations.jsx
import React, { useState, useContext } from "react";
import axios from "axios";
import {
  Box,
  Input,
  Button,
  SimpleGrid,
  VStack,
  Alert,
  AlertIcon,
  Text,
  Flex,
  ButtonGroup,
  Skeleton,
} from "@chakra-ui/react";
import MovieCard from "../components/MovieCard";
import { LocaleContext } from "../LocaleContext";
import SearchBox from "../components/SearchBox";

export default function Recommendations() {
  const { tmdbLang } = useContext(LocaleContext);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [algorithm, setAlgorithm] = useState("knn");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [genreFilter, setGenreFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortBy, setSortBy] = useState("score");

  // Шаг 1: поиск по названию
  const handleSearch = async () => {
    if (!query.trim()) return;
    setError(null);
    setSelectedMovie(null);
    setRecommendations([]);
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/movies/search`, {
        params: { q: query.trim() },
      });
      setSearchResults(data);
    } catch {
      setError("Помилка пошуку. Спробуйте інший запит.");
    } finally {
      setLoading(false);
    }
  };

  // Шаг 2: выбор фильма из результатов (без запроса рекомендций)
  const handlePickMovie = (movie) => {
    setSelectedMovie(movie);
    setRecommendations([]);
  };

  // Шаг 3: после того, как выбран фильм и алгоритм — получить рекомендации
  const fetchRecommendations = async () => {
    if (!selectedMovie) return;
    setError(null);
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/recommend/movie/${selectedMovie.movieId}`,
        { params: { n: 10, alg: algorithm } }
      );
      setRecommendations(data);
    } catch {
      setError("Не вдалося завантажити рекомендації.");
    } finally {
      setLoading(false);
    }
  };

  // Сброс к поиску
  const resetAll = () => {
    setQuery("");
    setSearchResults([]);
    setSelectedMovie(null);
    setRecommendations([]);
    setError(null);
  };

  return (
    <Box bg="gray.800" minH="100vh" p={4}>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon /> {error}
        </Alert>
      )}

      {/* 1) Поисковая форма */}
      {!selectedMovie && (
        <VStack spacing={4} mb={6}>
          <Box display="flex" w="100%">
            <VStack spacing={4} mb={6}>
              <SearchBox
                items={searchResults}
                onSelect={handlePickMovie}
                placeholder="Введіть назву фільму"
              />
            </VStack>
          </Box>
        </VStack>
      )}
      <Flex wrap="wrap" mb={4} gap={2}>
        <Select
          placeholder="Жанр"
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          w="150px">
          <option value="Action">Action</option>
          <option value="Drama">Drama</option>
          {/* … остальные жанры … */}
        </Select>
        <Select
          placeholder="Рік"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          w="120px">
          {Array.from({ length: 30 }).map((_, i) => {
            const y = 1995 + i;
            return (
              <option key={y} value={y}>
                {y}
              </option>
            );
          })}
        </Select>
        <Button onClick={() => setSortBy("popularity")}>По популярності</Button>
        <Button onClick={() => setSortBy("score")}>По рейтингу</Button>
      </Flex>

      {/* 2) Сетка результатов поиска */}
      {!selectedMovie && (
        <SimpleGrid columns={[1, 2, 3, 4]} spacing={6}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} height="350px" borderRadius="md" />
              ))
            : searchResults.map((m) => (
                <MovieCard
                  key={m.movieId}
                  movie={m}
                  onClickCard={() => handlePickMovie(m)}
                  showRating={false}
                />
              ))}
        </SimpleGrid>
      )}

      {/* 3) После выбора фильма — выбор алгоритма и кнопка «Показать» */}
      {selectedMovie && !recommendations.length && (
        <>
          <Button mb={4} onClick={resetAll}>
            Повернутись до пошуку
          </Button>

          <Text fontSize="xl" mb={2}>
            Обрано: <b>{selectedMovie.title}</b>
          </Text>

          <Text mb={2}>Оберіть алгоритм:</Text>
          <Flex mb={4}>
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

          <Button colorScheme="green" onClick={fetchRecommendations} mb={6}>
            Показати рекомендації
          </Button>
        </>
      )}

      {/* 4) Вывод рекомендаций */}
      {selectedMovie && recommendations.length > 0 && (
        <>
          <Button mb={4} onClick={resetAll}>
            Повернутись до пошуку
          </Button>

          <Text fontSize="2xl" fontWeight="bold" mb={4}>
            Рекомендації для “{selectedMovie.title}” ({algorithm.toUpperCase()})
          </Text>

          <SimpleGrid columns={[1, 2, 3, 4]} spacing={6}>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} height="350px" borderRadius="md" />
                ))
                
              : recommendations.map((m) => (
                  <MovieCard key={m.movieId} movie={m} showRating={true} />
                ))}
          </SimpleGrid>
        </>
      )}
    </Box>
  );
}
