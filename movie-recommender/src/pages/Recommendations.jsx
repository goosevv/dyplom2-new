import React, { useState, useContext } from "react";
import axios from "axios";
import {
  Box,
  VStack,
  Flex,
  Button,
  ButtonGroup, // <-- обязательно
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  useDisclosure,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import MovieCard from "../components/MovieCard";
import MovieModal from "../components/MovieModal";
import { LocaleContext } from "../LocaleContext";

export default function Recommendations() {
  const { tmdbLang } = useContext(LocaleContext);

  // 1) Поиск
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // 2) Выбран фильм + алгоритм
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [algorithm, setAlgorithm] = useState("hybrid");

  // 3) Рекомендации + Infinite Scroll
  const [recommendations, setRecommendations] = useState([]);
  const [displayed, setDisplayed] = useState([]);
  const PAGE_SIZE = 8;

  // 4) Фильтр по году
  const [yearFilter, setYearFilter] = useState("");

  // 5) Модалка
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalMovie, setModalMovie] = useState(null);

  // 6) Статусы
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [genreFilter, setGenreFilter] = useState("");
  const [availableGenres, setAvailableGenres] = useState([]); // Для опцій у Select

  // Поиск
  const handleSearch = async () => {
    if (!query.trim()) return;
    setError(null);
    setSelectedMovie(null);
    setRecommendations([]);
    setDisplayed([]);
    setHasSearched(true);
    setLoading(true);
    try {
      const res = await axios.get("/api/movies/search", {
        params: { q: query.trim() },
      });
      setSearchResults(res.data);
    } catch {
      setError("Помилка пошуку, спробуйте пізніше.");
    } finally {
      setLoading(false);
    }
  };

  // Выбрать фильм
  const handlePickMovie = (movie) => {
    setSelectedMovie(movie);
    setRecommendations([]);
    setDisplayed([]);
  };

  // Получить рекомендации
  const fetchRecommendations = async () => {
    if (!selectedMovie) return;
    setError(null);
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/recommend/movie/${selectedMovie.movieId}`,
        { params: { n: 100, alg: algorithm } }
      );
      setRecommendations(res.data);
      setDisplayed(res.data.slice(0, PAGE_SIZE));
      // ---> ВСТАВТЕ КОД ДЛЯ ЗБОРУ ЖАНРІВ ТУТ <---
      const allGenres = res.data.reduce((acc, movie) => {
        // Перевіряємо, чи є поле 'genres' і чи це рядок
        if (movie.genres && typeof movie.genres === "string") {
          // Розділяємо рядок по '|', очищаємо пробіли, додаємо в Set
          movie.genres.split("|").forEach((genre) => {
            const trimmedGenre = genre.trim();
            // Додаємо, якщо не порожній і не є заглушкою
            if (
              trimmedGenre &&
              trimmedGenre.toLowerCase() !== "(no genres listed)"
            ) {
              acc.add(trimmedGenre);
            }
          });
        }
        // Якщо ваш API може повертати жанри як масив рядків, додайте обробку:
        // else if (Array.isArray(movie.genres)) {
        //   movie.genres.forEach(genre => { ... });
        // }
        return acc;
      }, new Set()); // Використовуємо Set для унікальних значень

      // Встановлюємо відсортований масив жанрів у стан (додаємо порожній рядок для опції "Всі жанри")
      setAvailableGenres(["", ...Array.from(allGenres).sort()]);
      // ---> КІНЕЦЬ ВСТАВЛЕНОГО КОДУ <---
    } catch {
      console.error("Помилка завантаження рекомендацій:", err); // Додаємо лог помилки
      setError("Не вдалося завантажити рекомендації.");
    } finally {
      setLoading(false);
    }
  };

  // Загрузить ещё
  const loadMore = () => {
    const next = recommendations.slice(
      displayed.length,
      displayed.length + PAGE_SIZE
    );
    setDisplayed((d) => [...d, ...next]);
  };

  // Сброс всего
  const resetAll = () => {
    setQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setSelectedMovie(null);
    setRecommendations([]);
    setDisplayed([]);
    setYearFilter("");
    setError(null);
  };

  const filtered = displayed.filter((m) => {
    const yearMatch =
      !yearFilter || m.title.match(/\((\d{4})\)/)?.[1] === yearFilter;

    // Логіка фільтрації по жанру (припускаючи, що m.genres - це рядок "Genre1|Genre2")
    const movieGenresString =
      m.genres && typeof m.genres === "string" ? m.genres.toLowerCase() : "";
    const genreMatch =
      !genreFilter ||
      movieGenresString
        .split("|")
        .map((g) => g.trim())
        .includes(genreFilter.toLowerCase());

    // Альтернатива, якщо API повертає масив жанрів:
    // const movieGenresArray = Array.isArray(m.genres) ? m.genres.map(g=>g.toLowerCase()) : [];
    // const genreMatch = !genreFilter || movieGenresArray.includes(genreFilter.toLowerCase());

    return yearMatch && genreMatch;
  });

  return (
      <Box
        minH="calc(100vh - 70px)"
        maxW="1200px"     // максимальная ширина страницы
        mx="auto"         // центрирование по горизонтали
        px={4}            // отступы слева-справа
        py={6}            // отступы сверху-снизу
      >

      {/* 1. Поисковая форма */}
      {!selectedMovie && (
        <VStack spacing={6} mb={8} align="stretch">
          <InputGroup maxW="800px" w="100%" mx="auto">
            <InputLeftElement
              pointerEvents="none"
              left="4" // отступ от левого края
              height="100%" // займёт всю высоту инпута
              display="flex" // включаем флекс, чтобы выровнять по центру
              alignItems="center" // центрируем по вертикали
            >
              <SearchIcon boxSize={5} color="gray.400" />
            </InputLeftElement>
            <Input
              pl="3rem"
              placeholder="Введіть назву фільму"
              size="lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              bg="whiteAlpha.100" // Полупрозрачный фон для темной темы
              borderColor="whiteAlpha.300" // Граница
              _hover={{ borderColor: "whiteAlpha.400" }}
              focusBorderColor="brand.gold" // Золотая рамка при фокусе
              _placeholder={{ color: "gray.500" }} // Цвет плейсхолдера
              borderRadius="lg"
              // Убрали стандартные _focus стили, т.к. есть focusBorderColor
            />
          </InputGroup>
          <Box textAlign="center">
            <Button
              size="md"
              onClick={handleSearch}
              isLoading={loading}
              px={8}
              // Стилизуем кнопку:
              bg="brand.gold" // Золотой фон
              color="brand.purple" // Фиолетовый текст (или 'gray.900' для лучшего контраста)
              _hover={{ bg: "yellow.500" }} // Чуть темнее золото при наведении (можно добавить brand.goldHover в тему)
            >
              Знайти
            </Button>
          </Box>
        </VStack>
      )}

      {/* 2. Результаты поиска */}
      {!selectedMovie && hasSearched && (
        <SimpleGrid columns={[1, 2, 3, 4]} spacing={6}>
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <Spinner key={i} size="xl" />
              ))
            : searchResults.map((m) => (
                <MovieCard
                  key={m.movieId}
                  movie={m}
                  showRating // Добавлено (эквивалентно showRating={true})
                  onClickCard={() => handlePickMovie(m)}
                />
              ))}
        </SimpleGrid>
      )}

      {/* 3. Выбран фильм + алгоритм */}
      {selectedMovie && displayed.length === 0 && !loading && (
        <Box textAlign="center" mb={12}>
          <Button onClick={resetAll} mb={4}>
            Повернутись до пошуку
          </Button>
          <Box fontSize="2xl" fontWeight="bold" mb={4}>
            Обрано: {selectedMovie.title}
          </Box>
          <Flex justify="center" mb={4}>
            <ButtonGroup size="md" isAttached variant="outline">
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
          <Button
            colorScheme="green"
            size="lg"
            onClick={fetchRecommendations}
            isLoading={loading}>
            Показати рекомендації
          </Button>
        </Box>
      )}

      {/* 4. Фильтр по году */}
      {displayed.length > 0 && (
        <Flex wrap="wrap" justify="center" align="center" mb={6} gap={4}>
          <Select
            placeholder="Рік"
            size="md"
            w={{ base: "100%", sm: "120px" }}  // на мобилах 100%, на большом экране 120px
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}>
            {Array.from({ length: 30 }).map((_, i) => {
              const y = 1990 + i;
              return (
                <option key={y} value={`${y}`}>
                  {y}
                </option>
              );
            })}
          </Select>
          <Select
            placeholder="Усі жанри"
            size="md"
            w={{ base: "100%", sm: "150px" }}
            value={genreFilter}
            onChange={e => setGenreFilter(e.target.value)}
            isDisabled={availableGenres.length <= 1}>
            {availableGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre || "Усі жанри"}
              </option>
            ))}
          </Select>
        </Flex>
      )}

      {/* 5. Рекомендации */}
      {displayed.length > 0 && (
        <InfiniteScroll
          dataLength={filtered.length}
          next={loadMore}
          hasMore={displayed.length < recommendations.length}
          loader={<Spinner my={4} />}
          style={{ overflow: "visible" }}>
          <SimpleGrid columns={[2, 3, 4, 4]} spacing={6}>
            {filtered.map((m) => (
              <MovieCard
                key={m.movieId}
                movie={m}
                showRating
                onClickCard={() => {
                  setModalMovie(m);
                  onOpen();
                }}
              />
            ))}
          </SimpleGrid>
        </InfiniteScroll>
      )}

      {/* 6. Модал */}
      <MovieModal
        isOpen={isOpen}
        onClose={onClose}
        movieId={modalMovie?.movieId}
        title={modalMovie?.title}
      />
    </Box>
  );
}
