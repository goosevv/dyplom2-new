// src/components/MovieCard.jsx
import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import {
  Box,
  AspectRatio,
  Image,
  Heading,
  Text,
  IconButton,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
import { LocaleContext } from '../LocaleContext'
import {
  API,
  authHeaders,
  TMDB_KEY,
  TMDB_API_BASE,
  TMDB_IMG_BASE
} from '../config'

// Кэш жанров, чтобы не дергать API каждый раз
let genreMap = {}
async function loadGenres(lang) {
  if (Object.keys(genreMap).length) return
  try {
    const res = await axios.get(
      `${TMDB_API_BASE}/genre/movie/list`,
      { params: { api_key: TMDB_KEY, language: lang } }
    )
    res.data.genres.forEach(g => (genreMap[g.id] = g.name))
  } catch {}
}

export default function MovieCard({ movie, onClickCard }) {
  // ── 1. Хуки всегда в начале ─────────────────────
  const { tmdbLang } = useContext(LocaleContext)
  const [details, setDetails] = useState(null)
  const [liked, setLiked] = useState(false)
  const bg = useColorModeValue('white', 'gray.700')

  // ── 2. Эффект: загрузка деталей и лайков ────────
  useEffect(() => {
    loadGenres(tmdbLang)

    const favs = JSON.parse(localStorage.getItem('favorites') || '[]')
    setLiked(favs.includes(movie.movieId))

    const titleNoYear = movie.title.replace(/\s*\(\d{4}\)$/, '')
    const yearMatch   = movie.title.match(/\((\d{4})\)$/)
    const params      = { api_key: TMDB_KEY, query: titleNoYear, language: tmdbLang }
    if (yearMatch) params.year = yearMatch[1]

    axios
      .get(`${TMDB_API_BASE}/search/movie`, { params })
      .then(r => setDetails(r.data.results?.[0] || {}))
      .catch(() => setDetails({}))
  }, [movie.movieId, tmdbLang])

  // ── 3. Пока details === null — спиннер ───────────
  if (details === null) {
    return (
      <Box maxW="sm" w="100%" textAlign="center" py={6}>
        <Spinner size="lg" />
      </Box>
    )
  }

  // ── 4. Подготовка полей ─────────────────────────
  const poster = details.poster_path
    ? `${TMDB_IMG_BASE}${details.poster_path}`
    : '/placeholder.png'
  const year   = (details.release_date || '').slice(0, 4)
  const ids    = details.genre_ids || details.genres?.map(g => g.id) || []
  const genres = ids.map(id => genreMap[id]).filter(Boolean).join(', ')

  // ── 5. Обработчик «лайка» ───────────────────────
  const toggleLike = async e => {
    e.stopPropagation()
    try {
      if (liked) {
        await axios.delete(`${API}/favorites`, {
          ...authHeaders(),
          data: { movieId: movie.movieId }
        })
      } else {
        await axios.post(
          `${API}/favorites`,
          { movieId: movie.movieId },
          authHeaders()
        )
      }
      const favs    = JSON.parse(localStorage.getItem('favorites') || '[]')
      const updated = liked
        ? favs.filter(id => id !== movie.movieId)
        : [...favs, movie.movieId]
      localStorage.setItem('favorites', JSON.stringify(updated))
      setLiked(!liked)
    } catch {}
  }

  // ── 6. Рендер карточки с hover-эффектом ─────────
  return (
    <Box
      maxW="sm"
      w="100%"
      bg={bg}
      borderWidth="1px"
      borderRadius="md"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      cursor={onClickCard ? 'pointer' : 'default'}
      onClick={onClickCard}
      transition="all 0.2s ease"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg'
      }}
    >
      <AspectRatio ratio={2 / 3}>
        <Image src={poster} alt={details.title} objectFit="cover" />
      </AspectRatio>
      <Box p={4} flex="1" display="flex" flexDirection="column">
        <Heading as="h5" size="md" mb={2} isTruncated>
          {details.title}
        </Heading>
        <Text color="gray.500" fontSize="sm" mt="auto">
          {year} {genres && `• ${genres}`}
        </Text>
      </Box>
      <Box p={2} textAlign="right">
        <IconButton
          aria-label="Нравится"
          icon={liked ? <FaHeart /> : <FaRegHeart />}
          onClick={toggleLike}
          variant="outline"
          colorScheme="red"
        />
      </Box>
    </Box>
  )
}

