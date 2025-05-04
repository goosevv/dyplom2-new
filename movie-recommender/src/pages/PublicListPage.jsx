// src/pages/PublicListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Heading, Spinner, Alert, AlertIcon, SimpleGrid, Text, Center, Button, Link
  // useColorModeValue убран
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import MovieCard from '../components/MovieCard'; // MovieCard стилизуется отдельно

export default function PublicListPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [listData, setListData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // const bg = useColorModeValue("gray.100", "gray.800"); // Убран

  const fetchPublicListDetails = useCallback(async () => {
    // ... (логика без изменений) ...
    setIsLoading(true); setError(null);
    try {
      const response = await axios.get(`/api/lists/${listId}`);
      if (!response.data?.is_public) { throw new Error("Цей список не є публічним."); }
      setListData(response.data);
    } catch (err) {
      const errorDesc = err.response?.data?.description || err.message || "Не вдалося завантажити список.";
      setError(`Список не знайдено або він є приватним (ID: ${listId}). ${errorDesc}`); setListData(null);
      console.error("Fetch public list details error:", err.response?.data || err);
    } finally { setIsLoading(false); }
  }, [listId]);

  useEffect(() => { fetchPublicListDetails(); }, [fetchPublicListDetails]);

  // --- Рендеринг ---
  if (isLoading) { return ( <Center h="calc(100vh - 70px)"> <Spinner size="xl" color="brand.gold"/> </Center> ); }

  if (error) {
    return (
      <Box minH="calc(100vh - 70px)" py={10} px={4}>
         <Alert status="error" maxW="xl" mx="auto" borderRadius="md" variant="subtle"> <AlertIcon /> {error} </Alert>
         <Center mt={4}>
            {/* Стилизуем кнопку */}
            <Button as={RouterLink} to="/" leftIcon={<ArrowBackIcon />} variant="outline" borderColor="brand.gold" color="brand.gold" _hover={{bg: "whiteAlpha.100"}}>На головну</Button>
         </Center>
      </Box>
    );
  }

  if (!listData) { return ( <Text>Список не знайдено.</Text> ); }

  return (
    // Убираем bg
    <Box minH="calc(100vh - 70px)" py={10} px={4}>
      <Box maxW="6xl" mx="auto">
         <Button leftIcon={<ArrowBackIcon />} mb={4} onClick={() => navigate(-1)} variant="ghost" color="gray.400" _hover={{color:"white"}}>
          Назад
        </Button>
        <Heading as="h1" size="xl" mb={2} color="brand.gold" textAlign="center"> {/* Золотой заголовок */}
          {listData.name}
        </Heading>
        <Text color="gray.500" mb={6} textAlign="center">
          Публічний список {listData.owner_name ? `від ${listData.owner_name}` : ''}
        </Text>

        {listData.movies.length === 0 ? (
          <Text textAlign="center" color="gray.400">Цей список порожній.</Text>
        ) : (
           // Увеличили кол-во колонок
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing={6}>
            {listData.movies.map((movie) => (
              // MovieCard стилизуется отдельно
              <MovieCard key={movie.movieId} movie={movie} /> // Убрали showRating и onClickCard для публичной версии
            ))}
          </SimpleGrid>
        )}
         <Center mt={8}>
            {/* Стилизуем кнопку */}
            <Button as={RouterLink} to="/" variant="outline" borderColor="brand.gold" color="brand.gold" _hover={{bg: "whiteAlpha.100"}}>На головну</Button>
         </Center>
      </Box>
    </Box>
  );
}