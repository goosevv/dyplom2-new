// src/pages/Recommendations.jsx
import React, { useState } from 'react'
import axios from 'axios'
import MovieCard from '../components/MovieCard'
import {
  Box,
  Button,
  Input,
  SimpleGrid,
  VStack,
  Alert,
  AlertIcon,
  useColorModeValue
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

export default function Recommendations() {
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [error, setError]           = useState(null)
  const navigate                    = useNavigate()
  const bg                          = useColorModeValue('gray.50', 'gray.800')

  const handleSearch = async () => {
    setError(null)
    try {
      // /search проксируется на бекенд
      const { data } = await axios.get('/search', { params: { q: query } })
      setResults(data)
      setSelectedMovie(null)
    } catch {
      setError('Помилка пошуку. Спробуйте інший запит.')
    }
  }

  const handleSelect = async (movie) => {
    setError(null)
    setSelectedMovie(movie)
    try {
      // /recommend/movie/:id проксируется
      const { data } = await axios.get(`/recommend/movie/${movie.movieId}`)
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
    <Box bg={bg} minH="100vh" p={4}>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {!selectedMovie ? (
        <VStack spacing={4} mb={6}>
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

      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6} alignItems="stretch">
        {results.map(movie => (
          <MovieCard
            key={movie.movieId}
            movie={movie}
            onClickCard={!selectedMovie ? () => handleSelect(movie) : undefined}
          />
        ))}
      </SimpleGrid>
    </Box>
  )
}

