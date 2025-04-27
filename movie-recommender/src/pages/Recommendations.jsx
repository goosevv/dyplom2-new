// src/pages/Recommendations.jsx
import React, { useState, useContext } from 'react';
import axios from 'axios';
import {
  Box,
  VStack,
  Flex,
  Button,
  ButtonGroup,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import InfiniteScroll from 'react-infinite-scroll-component';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import { LocaleContext } from '../LocaleContext';

export default function Recommendations() {
  const { tmdbLang } = useContext(LocaleContext);
  const bg = useColorModeValue('gray.50', 'gray.800');
  const fg = useColorModeValue('gray.800', 'white');

  // 1) Поисковая часть
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // 2) Выбран фильм и алгоритм
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [algorithm, setAlgorithm] = useState('hybrid');

  // 3) Рекомендации + infinite scroll
  const [recommendations, setRecommendations] = useState([]);
  const [displayed, setDisplayed] = useState([]);
  const PAGE_SIZE = 8;

  // 4) Фильтр по году и сортировка
  const [yearFilter, setYearFilter] = useState('');
  const [sortBy, setSortBy] = useState('score');

  // 5) Модальное окно
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalMovie, setModalMovie] = useState(null);

  // 6) Статусы
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Поиск по названию
  const handleSearch = async () => {
    if (!query.trim()) return;
    setError(null);
    setSelectedMovie(null);
    setRecommendations([]);
    setDisplayed([]);
    setHasSearched(true);
    setLoading(true);
    try {
      const res = await axios.get('/api/movies/search', {
        params: { q: query.trim() }
      });
      setSearchResults(res.data);
    } catch {
      setError('Помилка пошуку, спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  // Выбрать фильм из результатов
  const handlePickMovie = movie => {
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
    } catch {
      setError('Не вдалося завантажити рекомендації.');
    } finally {
      setLoading(false);
    }
  };

  // Подгрузить ещё
  const loadMore = () => {
    const next = recommendations.slice(displayed.length, displayed.length + PAGE_SIZE);
    setDisplayed(d => [...d, ...next]);
  };

  // Сбросить весь процесс
  const resetAll = () => {
    setQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setSelectedMovie(null);
    setRecommendations([]);
    setDisplayed([]);
    setYearFilter('');
    setSortBy('score');
    setError(null);
  };

  // Фильтруем и сортируем отображаемые
  const filtered = displayed
    .filter(m => {
      if (!yearFilter) return true;
      const year = m.title.match(/\((\d{4})\)/)?.[1];
      return year === yearFilter;
    })
    .sort((a, b) =>
      sortBy === 'score' ? b.score - a.score : 0
    );

  return (
    <Box bg={bg} minH="100vh" p={6} color={fg}>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon /> {error}
        </Alert>
      )}

      {/* 1. Поисковая форма (всё вместе) */}
      {!selectedMovie && (
        <VStack spacing={6} mb={8} align="stretch">
          <InputGroup maxW="800px" w="100%" mx="auto">
            <InputLeftElement
              pointerEvents="none"
              children={<SearchIcon color="gray.400" />}
            />
            <Input
              placeholder="Введіть назву фільму"
              size="lg"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              bg={useColorModeValue('white','gray.700')}
              borderRadius="lg"
              _focus={{
                boxShadow: '0 0 0 2px ' + useColorModeValue('blue.300','blue.600'),
                borderColor: useColorModeValue('blue.300','blue.600'),
              }}
            />
          </InputGroup>
          <Box textAlign="center">
            <Button
              colorScheme="blue"
              size="md"
              onClick={handleSearch}
              isLoading={loading}
              px={8}
            >
              Знайти
            </Button>
          </Box>
        </VStack>
      )}

      {/* 2. Результаты поиска */}
      {!selectedMovie && hasSearched && (
        <SimpleGrid columns={[1,2,3,4]} spacing={6}>
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <Spinner key={i} size="xl" />
              ))
            : searchResults.map(m => (
                <MovieCard
                  key={m.movieId}
                  movie={m}
                  onClickCard={() => handlePickMovie(m)}
                />
              ))}
        </SimpleGrid>
      )}

      {/* 3. Выбран фильм → выбор алгоритма */}
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
              {['knn','content','svd','hybrid'].map(alg => (
                <Button
                  key={alg}
                  isActive={algorithm === alg}
                  onClick={() => setAlgorithm(alg)}
                >
                  {alg.toUpperCase()}
                </Button>
              ))}
            </ButtonGroup>
          </Flex>
          <Button
            colorScheme="green"
            size="lg"
            onClick={fetchRecommendations}
            isLoading={loading}
          >
            Показати рекомендації
          </Button>
        </Box>
      )}

      {/* 4. Фильтры & сортировка */}
      {displayed.length > 0 && (
        <Flex wrap="wrap" justify="center" align="center" mb={6} gap={4}>
          <Select
            placeholder="Рік"
            size="md"
            minW="120px"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          >
            {Array.from({ length: 30 }).map((_, i) => {
              const y = 1990 + i;
              return (
                <option key={y} value={`${y}`}>
                  {y}
                </option>
              );
            })}
          </Select>
        </Flex>
      )}

      {/* 5. Рекомендации с бесконечным скроллом */}
      {displayed.length > 0 && (
        <InfiniteScroll
          dataLength={filtered.length}
          next={loadMore}
          hasMore={displayed.length < recommendations.length}
          loader={<Spinner my={4} />}
          style={{ overflow: 'visible' }}
        >
          <SimpleGrid columns={[1,2,3,4]} spacing={6}>
            {filtered.map(m => (
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

      {/* 6. Модал с деталями */}
      <MovieModal
        isOpen={isOpen}
        onClose={onClose}
        movieId={modalMovie?.movieId}
        title={modalMovie?.title}
      />
    </Box>
  );
}
