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
  VStack
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { LocaleContext } from '../LocaleContext';
import { TMDB_KEY, TMDB_API_BASE, TMDB_IMG_BASE, authHeaders } from '../config';

const MotionBox = motion(Box);
const genreCache = {};

async function loadGenres(lang) {
  if (genreCache[lang]) return genreCache[lang];
  try {
    const res = await axios.get(`${TMDB_API_BASE}/genre/movie/list`, {
      params: { api_key: TMDB_KEY, language: lang }
    });
    const map = {};
    res.data.genres.forEach(g => (map[g.id] = g.name));
    genreCache[lang] = map;
    return map;
  } catch {
    return {};
  }
}

export default function MovieCard({ movie, onClickCard, showRating }) {
  const { tmdbLang } = useContext(LocaleContext);
  const [details, setDetails] = useState(null);
  const [liked, setLiked] = useState(false);

  const bg = useColorModeValue('white', 'gray.700');
  const overlayBg = useColorModeValue('rgba(255,255,255,0.9)', 'rgba(0,0,0,0.8)');
  const footerBg = useColorModeValue('whiteAlpha.900', 'blackAlpha.900');
  const textColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    let mounted = true;
    loadGenres(tmdbLang);
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    setLiked(favs.includes(movie.movieId));

    const titleNoYear = movie.title.replace(/\s*\(\d{4}\)$/, '');
    const yearMatch = movie.title.match(/\((\d{4})\)$/);
    const params = { api_key: TMDB_KEY, query: titleNoYear, language: tmdbLang };
    if (yearMatch) params.year = yearMatch[1];

    axios
      .get(`${TMDB_API_BASE}/search/movie`, { params })
      .then(r => mounted && setDetails(r.data.results?.[0] || {}))
      .catch(() => mounted && setDetails({}));

    return () => { mounted = false; };
  }, [movie.movieId, tmdbLang]);

  const toggleLike = async e => {
    e.stopPropagation();
    try {
      if (liked) {
        await axios.delete('/api/recommend/user/favorites', {
          ...authHeaders(),
          data: { movieId: movie.movieId }
        });
      } else {
        await axios.post(
          '/api/recommend/user/favorites',
          { movieId: movie.movieId },
          authHeaders()
        );
      }
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const updated = liked
        ? favs.filter(id => id !== movie.movieId)
        : [...favs, movie.movieId];
      localStorage.setItem('favorites', JSON.stringify(updated));
      setLiked(!liked);
    } catch {}
  };

  if (details === null) {
    return (
      <Box maxW="sm" w="100%" bg={bg} textAlign="center" py={6}>
        <Spinner size="lg" />
      </Box>
    );
  }

  const poster = details.poster_path
    ? `${TMDB_IMG_BASE}${details.poster_path}`
    : '/placeholder.png';
  const year = (details.release_date || '').slice(0, 4);
  const ids = details.genre_ids || details.genres?.map(g => g.id) || [];
  const genres = ids
    .map(id => genreCache[tmdbLang]?.[id])
    .filter(Boolean)
    .join(', ');
  const overview = details.overview || 'Опис відсутній';

  return (
    <MotionBox
      as="div"
      pos="relative"
      maxW="sm"
      w="100%"
      bg={bg}
      boxShadow="md"
      borderRadius="md"
      overflow="hidden"
      role="group"
      cursor="pointer"
      onClick={onClickCard}
      initial={{ scale: 1 }}
      whileHover={{ scale: 1.03, boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
      transition={{ duration: 0.2 }}
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
        transition="opacity .3s"
        _groupHover={{ opacity: 1 }}
        display="flex"
        flexDirection="column"
      >
        <VStack
          flex="1"
          overflowY="auto"
          align="start"
          spacing={2}
          p={4}
          color={textColor}
        >
          <Text fontSize="sm">{overview}</Text>
        </VStack>

        <Flex
          p={3}
          bg={footerBg}
          align="center"
          justify="space-between"
          borderTop="1px solid"
          borderColor={useColorModeValue('gray.200', 'gray.600')}
        >
          <Text fontSize="xs" color="gray.500" isTruncated maxW="65%">
            {year}
            {genres && ` • ${genres}`}
          </Text>

          {showRating && (
            <Text fontSize="sm" fontWeight="bold">
              {movie.score?.toFixed(2)}
            </Text>
          )}

          <IconButton
            aria-label="Нравиться"
            icon={liked ? <FaHeart /> : <FaRegHeart />}
            onClick={toggleLike}
            variant="ghost"
            size="sm"
            colorScheme="red"
          />
        </Flex>
      </Box>
    </MotionBox>
  );
}
