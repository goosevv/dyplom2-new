// src/pages/Recommendations.jsx
import React, { useState } from 'react'
import axios from 'axios'
import { API } from '../config'
import MovieCard from '../components/MovieCard'

import {
  Box,
  Heading,
  Input,
  Button,
  SimpleGrid,
  VStack,
  Alert,
} from '@chakra-ui/react'
import { AlertIcon } from '@chakra-ui/icons'
export default function Recommendations() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [error, setError] = useState(null)

  const handleSearch = async () => {
    setError(null)
    try {
      const { data } = await axios.get(`${API}/search`, { params: { q: query } })
      setResults(data)
      setSelectedMovie(null)
    } catch {
      setError('Помилка пошуку. Спробуйте інший запит.')
    }
  }

  const handleSelect = async (movie) => {
    setError(null)
    try {
      setSelectedMovie(movie)
      const { data } = await axios.get(`${API}/recommend/movie/${movie.movieId}`)
      setResults(data)
    } catch {
      setError('Не вдалося завантажити рекомендації.')
    }
  }

  const reset = () => {
    setQuery('')
    setResults([])
    setSelectedMovie(null)
    setError(null)
  }

  return (
    <Box maxW="8xl" mx="auto" p={4}>
      <Heading mb={4}>Рекомендовані фільми</Heading>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {!selectedMovie ? (
        <VStack spacing={4} mb={6} align="start">
          <Box display="flex" w="100%">
            <Input
              placeholder="Введіть назву фільму"
              value={query}
              onChange={e => setQuery(e.target.value)}
              mr={2}
            />
            <Button colorScheme="blue" onClick={handleSearch}>
              Знайти
            </Button>
          </Box>
        </VStack>
      ) : (
        <Button mb={6} onClick={reset}>
          Повернутись до пошуку
        </Button>
      )}

      <SimpleGrid columns={[1, 2, 3]} spacing={6}>
        {results.map(movie => (
          <Box
            key={movie.movieId}
            onClick={!selectedMovie ? () => handleSelect(movie) : undefined}
            cursor={!selectedMovie ? 'pointer' : 'default'}
          >
            <MovieCard
              movie={movie}
              onClickCard={!selectedMovie ? () => handleSelect(movie) : undefined}
            />
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}
