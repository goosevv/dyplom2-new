// src/components/MovieCard.jsx
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Box,
  Image,
  Heading,
  Text,
  IconButton,
  Spinner,
  Stack
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
  try {
    const res = await axios.get(`${TMDB_API_BASE}/genre/movie/list`, {
      params: { api_key: TMDB_KEY, language: 'uk-UA' }
    })
    res.data.genres.forEach(g => (genreMap[g.id] = g.name))
  } catch {}
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

  const toggleLike = async (e) => {
    e.stopPropagation()
    if (liked) {
      await axios.delete(`${API}/like/${movie.movieId}`, authHeaders())
    } else {
      await axios.post(`${API}/like/${movie.movieId}`, null, authHeaders())
    }
    let favs = JSON.parse(localStorage.getItem('favorites') || '[]')
    favs = liked
      ? favs.filter(id => id !== movie.movieId)
      : [...favs, movie.movieId]
    localStorage.setItem('favorites', JSON.stringify(favs))
    setLiked(!liked)
  }

  if (details === null) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="lg" h="100%">
        <Spinner mx="auto" my={8} />
      </Box>
    )
  }

  const poster = details.poster_path
    ? `${TMDB_IMG_BASE}${details.poster_path}`
    : '/placeholder.png'
  const year = (details.release_date || '').slice(0, 4)
  const ids = details.genre_ids || details.genres?.map(g => g.id) || []
  const genres = ids.map(id => genreMap[id]).filter(Boolean).join(', ')

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      h="100%"
      display="flex"
      flexDirection="column"
      onClick={onClickCard}
    >
      <Image
        src={poster}
        alt={details.title}
        objectFit="cover"
        h="300px"
        w="100%"
      />
      <Box p={4} flex="1">
        <Stack spacing={2} h="100%">
          <Heading as="h5" size="md">
            {details.title}
          </Heading>
          <Text color="gray.500" mt="auto">
            {year}{genres && ` • ${genres}`}
          </Text>
        </Stack>
      </Box>
      <Box p={2} textAlign="right">
        <IconButton
          aria-label="Like"
          icon={liked ? <FaHeart /> : <FaRegHeart />}
          onClick={toggleLike}
          variant="outline"
          colorScheme="red"
        />
      </Box>
    </Box>
  )
}

