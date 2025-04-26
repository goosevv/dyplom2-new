// src/components/MovieCard.jsx
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Box,
  Image,
  Heading,
  Text,
  IconButton,
  Stack,
  useColorModeValue
} from '@chakra-ui/react'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
import {
  API,
  authHeaders,
  TMDB_KEY,
  TMDB_API_BASE,
  TMDB_IMG_BASE
} from '../config'

let genreMap = {}
async function loadGenres() {
  if (Object.keys(genreMap).length) return
  const { data } = await axios.get(`${TMDB_API_BASE}/genre/movie/list`, {
    params: { api_key: TMDB_KEY, language: 'uk-UA' }
  })
  data.genres.forEach(g => (genreMap[g.id] = g.name))
}

export default function MovieCard({ movie, onClickCard }) {
  const [details, setDetails] = useState(null)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    loadGenres()
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]')
    setLiked(favs.includes(movie.movieId))

    const titleNoYear = movie.title.replace(/\s*\(\d{4}\)$/, '')
    const yearMatch = movie.title.match(/\((\d{4})\)$/)
    const params = { api_key: TMDB_KEY, query: titleNoYear, language: 'uk-UA' }
    if (yearMatch) params.year = yearMatch[1]

    axios
      .get(`${TMDB_API_BASE}/search/movie`, { params })
      .then(({ data }) => setDetails(data.results?.[0] || {}))
      .catch(() => setDetails({}))
  }, [movie.movieId])

  const toggleLike = e => {
    e.stopPropagation()
    // ... ваш код лайка
    setLiked(l => !l)
  }

  if (!details) return null

  const poster = details.poster_path
    ? `${TMDB_IMG_BASE}${details.poster_path}`
    : '/placeholder.png'
  const year = (details.release_date || '').slice(0, 4)
  const ids = details.genre_ids || details.genres?.map(g => g.id) || []
  const genres = ids.map(id => genreMap[id]).filter(Boolean).join(', ')

  // Цвета оверлея и текста в зависимости от темы
  const overlayBg = useColorModeValue('rgba(255,255,255,0.6)', 'rgba(0,0,0,0.6)')
  const overlayColor = useColorModeValue('gray.800', 'white')

  return (
    <Box
      role="group"
      pos="relative"
      overflow="hidden"
      borderRadius="md"
      boxShadow="md"
      cursor={onClickCard ? 'pointer' : 'default'}
      onClick={onClickCard}
      _hover={{ boxShadow: 'xl' }}
    >
      {/* Постер с плавным зумом */}
      <Image
        src={poster}
        alt={details.title}
        w="100%"
        h="350px"
        objectFit="cover"
        transition="transform .3s"
        _groupHover={{ transform: 'scale(1.05)' }}
      />

      {/* Оверлей, появляется на hover */}
      <Box
        pos="absolute"
        inset="0"
        bg={overlayBg}
        opacity="0"
        transition="opacity .3s"
        _groupHover={{ opacity: 1 }}
        color={overlayColor}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDir="column"
        textAlign="center"
        p={4}
      >
        {/* Например, рейтинг или кнопка */}
        <IconButton
          aria-label="Like"
          icon={liked ? <FaHeart /> : <FaRegHeart />}
          size="lg"
          variant="ghost"
          colorScheme="red"
          onClick={toggleLike}
        />
        <Text fontWeight="bold" mt={2}>
          {details.vote_average?.toFixed(1)} ⭐
        </Text>
      </Box>

      {/* Нижняя часть: название, год и жанры */}
      <Box p={4} bg={useColorModeValue('white', 'gray.800')}>
        <Stack spacing={1}>
          <Heading as="h3" size="md" isTruncated>
            {details.title}
          </Heading>
          <Text fontSize="sm" color="gray.500">
            {year} • {genres}
          </Text>
        </Stack>
      </Box>
    </Box>
  )
}
