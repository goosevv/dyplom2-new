import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
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
  Tooltip,
} from '@chakra-ui/react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import ReactStars from 'react-rating-stars-component';
import { TMDB_KEY, TMDB_API_BASE, TMDB_IMG_BASE, authHeaders } from '../config';
import { LocaleContext } from '../LocaleContext';

export default function MovieCard({ movie, onClickCard, showRating }) {
  // 1) Контекст локали
  const { tmdbLang } = useContext(LocaleContext);

  // 2) Получаем из localStorage токен
  const token = localStorage.getItem('access_token');
  const loggedIn = Boolean(token);

  // 3) Цвета и стили
  const bg = useColorModeValue('white', 'gray.700');
  const overlayBg = useColorModeValue('rgba(255,255,255,0.9)', 'rgba(0,0,0,0.8)');
  const footerBg = useColorModeValue('whiteAlpha.900', 'blackAlpha.900');
  const textColor = useColorModeValue('gray.800', 'white');

  // 4) Локальные стейты
  const [details, setDetails] = useState(null);
  const [liked, setLiked] = useState(false);
  const [userRating, setUserRating] = useState(movie.scoreByUser ?? 0);

  // 5) Эффект для загрузки данных
  useEffect(() => {
    let mounted = true;
    const params = {
      api_key: TMDB_KEY,
      query: movie.title.replace(/\s*\(\d{4}\)$/, ''),
      language: tmdbLang,
    };
    const yearMatch = movie.title.match(/\((\d{4})\)$/);
    if (yearMatch) params.year = yearMatch[1];

    axios
      .get(`${TMDB_API_BASE}/search/movie`, { params })
      .then(r => mounted && setDetails(r.data.results?.[0] || {}))
      .catch(() => mounted && setDetails({}));

    return () => {
      mounted = false;
    };
  }, [movie.title, tmdbLang]);

  // 6) Лайк
  const toggleLike = async e => {
    e.stopPropagation();
    try {
      if (liked) {
        await axios.delete('/api/recommend/user/favorites', {
          ...authHeaders(),
          data: { movieId: movie.movieId },
        });
      } else {
        await axios.post(
          '/api/recommend/user/favorites',
          { movieId: movie.movieId },
          authHeaders()
        );
      }
      setLiked(!liked);
    } catch {}
  };

  // 7) Пока нет details — спиннер
  if (!details) {
    return (
      <Box maxW="sm" w="100%" bg={bg} textAlign="center" py={6}>
        <Spinner size="lg" />
      </Box>
    );
  }

  // 8) Готовим данные для рендера
  const poster = details.poster_path
    ? `${TMDB_IMG_BASE}${details.poster_path}`
    : '/placeholder.png';
  const year = (details.release_date || '').slice(0, 4);
  const genres = (details.genres || []).map(g => g.name).join(', ');
  const overview = details.overview || 'Опис відсутній';

  return (
    <Box
      pos="relative"
      maxW="sm"
      w="100%"
      bg={bg}
      boxShadow="md"
      borderRadius="md"
      overflow="hidden"
      cursor="pointer"
      onClick={onClickCard}
      _hover={{ transform: 'scale(1.02)', boxShadow: 'lg' }}
      transition="transform .2s, box-shadow .2s"
    >
      <AspectRatio ratio={2 / 3}>
        <Image src={poster} alt={details.title} objectFit="cover" />
      </AspectRatio>

      <Box p={2}>
        <Heading as="h5" size="md" isTruncated>
          {details.title}
        </Heading>
      </Box>

      <Box
        pos="absolute"
        inset="0"
        bg={overlayBg}
        opacity="0"
        _hover={{ opacity: 1 }}
        transition="opacity .3s"
        display="flex"
        flexDirection="column"
      >
        <Flex flex="1" overflowY="auto" p={4} color={textColor}>
          <Text fontSize="sm">{overview}</Text>
        </Flex>
        <Flex
          p={3}
          bg={footerBg}
          align="center"
          justify="space-between"
          borderTop="1px solid"
          borderColor={useColorModeValue('gray.200', 'gray.600')}
        >
          <Text fontSize="xs" color="gray.500" isTruncated maxW="40%">
            {year}
            {genres && ` • ${genres}`}
          </Text>

          {showRating && (
            <Text fontSize="sm" fontWeight="bold" mr={2}>
              {movie.score?.toFixed(2)}
            </Text>
          )}

          {loggedIn ? (
            <ReactStars
              count={5}
              size={20}
              value={userRating}
              activeColor="#ffd700"
              onChange={newRating => {
                setUserRating(newRating);
                axios.post(
                  '/api/ratings',
                  { movieId: movie.movieId, score: newRating },
                  authHeaders()
                );
              }}
            />
          ) : (
            <Tooltip label="Увійдіть, щоб оцінити">
              <Box>
                <FaRegHeart color="gray" />
              </Box>
            </Tooltip>
          )}

          <IconButton
            aria-label="Нравится"
            icon={liked ? <FaHeart /> : <FaRegHeart />}
            onClick={toggleLike}
            variant="ghost"
            size="sm"
            colorScheme="red"
          />
        </Flex>
      </Box>
    </Box>
  );
}
