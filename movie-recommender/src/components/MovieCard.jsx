import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  AspectRatio,
  Image,
  Heading,
  Text,
  IconButton,
  Spinner,
  Flex,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import ReactStars from 'react-rating-stars-component';
import {
  TMDB_KEY,
  TMDB_API_BASE,
  TMDB_IMG_BASE,
} from '../config';
import { LocaleContext } from '../LocaleContext';

export default function MovieCard({ movie, onClickCard, showRating }) {
  const { tmdbLang } = useContext(LocaleContext);
  const token = localStorage.getItem('token');
  const loggedIn = Boolean(token);

  const [details, setDetails] = useState(null);
  const [liked, setLiked] = useState(false);
  const [userRating, setUserRating] = useState(0);

  // Fetch TMDb movie details
  useEffect(() => {
    let mounted = true;
    const params = {
      api_key: TMDB_KEY,
      language: tmdbLang,
      query: movie.title.replace(/\s*\(\d{4}\)$/, ''),
    };
    const yearMatch = movie.title.match(/\((\d{4})\)$/);
    if (yearMatch) params.year = yearMatch[1];

    axios
      .get(`${TMDB_API_BASE}/search/movie`, { params })
      .then(res => {
        if (mounted) setDetails(res.data.results?.[0] || {});
      })
      .catch(() => {
        if (mounted) setDetails({});
      });

    return () => {
      mounted = false;
    };
  }, [movie.title, tmdbLang]);

  // Load user rating and favorites
  useEffect(() => {
    if (!loggedIn) return;

    // Load user rating
    axios
      .get(`/api/ratings/${localStorage.getItem('user_id')}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        const rec = res.data.find(r => r.movieId === movie.movieId);
        setUserRating(rec ? rec.score : 0);
      })
      .catch(() => {});

    // Load favorites (no Content-Type header)
    axios
      .get('/api/recommend/user/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setLiked(res.data.some(m => m.movieId === movie.movieId));
      })
      .catch(() => {});
  }, [loggedIn, movie.movieId]);

  // Handle star rating change
  const handleRatingChange = newRating => {
    setUserRating(newRating);
    axios.post(
      '/api/ratings',
      { movieId: movie.movieId, score: newRating },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    ).catch(err => console.error(err));
  };

  // Toggle favorite
  const toggleLike = e => {
    e.stopPropagation();
    if (!loggedIn) return;

    if (liked) {
      axios.delete(
        '/api/recommend/user/favorites',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: { movieId: movie.movieId }
        }
      )
      .then(() => setLiked(false))
      .catch(err => console.error(err));
    } else {
      axios.post(
        '/api/recommend/user/favorites',
        { movieId: movie.movieId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      .then(() => setLiked(true))
      .catch(err => console.error(err));
    }
  };

  // Show loading spinner if TMDb details not ready
  if (!details || !details.title) {
    return (
      <Box maxW="sm" w="100%" bg={useColorModeValue('white','gray.700')} textAlign="center" py={6}>
        <Spinner size="lg" />
      </Box>
    );
  }

  const poster = details.poster_path
    ? `${TMDB_IMG_BASE}${details.poster_path}`
    : '/placeholder.png';
  const year = details.release_date?.slice(0, 4) || '';
  const genres = (details.genres || []).map(g => g.name).join(', ');
  const overview = details.overview || 'Опис відсутній';

  return (
    <Box
      pos="relative"
      maxW="sm"
      w="100%"
      bg={useColorModeValue('white','gray.700')}
      boxShadow="md"
      borderRadius="md"
      overflow="hidden"
      cursor="pointer"
      onClick={onClickCard}
      transition="transform .2s, box-shadow .2s"
      _hover={{ transform: 'scale(1.02)', boxShadow: 'lg' }}
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
        bg={useColorModeValue('rgba(255,255,255,0.9)','rgba(0,0,0,0.8)')}
        opacity={0}
        _hover={{ opacity: 1 }}
        transition="opacity .3s"
        display="flex"
        flexDirection="column"
      >
        <Flex flex="1" overflowY="auto" p={4} color={useColorModeValue('gray.800','white')}>
          <Text fontSize="sm">{overview}</Text>
        </Flex>
        <Flex
          p={3}
          bg={useColorModeValue('whiteAlpha.900','blackAlpha.900')}
          align="center"
          justify="space-between"
          borderTop="1px solid"
          borderColor={useColorModeValue('gray.200','gray.600')}
        >
          <Text fontSize="xs" color="gray.500" isTruncated maxW="40%">
            {year}{genres && ` • ${genres}`}
          </Text>

          {showRating && (
            loggedIn ? (
              <ReactStars
                count={5}
                size={20}
                value={userRating}
                onChange={handleRatingChange}
              />
            ) : (
              <Tooltip label="Увійдіть, щоб оцінити">
                <Box><FaRegHeart /></Box>
              </Tooltip>
            )
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
