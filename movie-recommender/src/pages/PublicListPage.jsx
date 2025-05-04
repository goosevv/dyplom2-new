// src/pages/PublicListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  SimpleGrid,
  Text,
  useColorModeValue,
  Center,
  Button,
  Link // Добавим для ссылки на главную
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import MovieCard from '../components/MovieCard'; // Используем ту же карточку

export default function PublicListPage() {
  const { listId } = useParams(); // Получаем ID списка из URL
  const navigate = useNavigate();
  const [listData, setListData] = useState(null); // { id, name, movies: [], is_public }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const bg = useColorModeValue("gray.100", "gray.800");

  // Функция загрузки данных публичного списка
  const fetchPublicListDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // !!! ВАЖНО: НЕ отправляем токен авторизации !!!
    // Бэкенд сам проверит, публичный ли список с этим ID
    try {
      const response = await axios.get(`/api/lists/${listId}`); // Простой GET без headers
      // Дополнительная проверка на клиенте, что список действительно публичный
      if (!response.data?.is_public) {
         throw new Error("Цей список не є публічним."); // Генерируем ошибку, если бэкенд вернул приватный
      }
      setListData(response.data);
    } catch (err) {
      const errorDesc = err.response?.data?.description || err.message || "Не вдалося завантажити список.";
      setError(`Список не знайдено або він є приватним (ID: ${listId}). ${errorDesc}`);
      setListData(null);
      console.error("Fetch public list details error:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  }, [listId]);

  // Загружаем данные при монтировании или смене listId
  useEffect(() => {
    fetchPublicListDetails();
  }, [fetchPublicListDetails]);

  // --- Рендеринг ---

  if (isLoading) {
    return ( <Center h="100vh"> <Spinner size="xl" /> </Center> );
  }

  if (error) {
    return (
      <Box bg={bg} minH="100vh" py={10} px={4}>
         <Alert status="error" maxW="xl" mx="auto" borderRadius="md"> <AlertIcon /> {error} </Alert>
         <Center mt={4}>
            <Button as={RouterLink} to="/" leftIcon={<ArrowBackIcon />} variant="link">На головну</Button>
         </Center>
      </Box>
    );
  }

  if (!listData) { // Маловероятно, если нет ошибки, но на всякий случай
     return (
      <Box bg={bg} minH="100vh" py={10} px={4}>
         <Text textAlign="center">Список не знайдено.</Text>
          <Center mt={4}>
            <Button as={RouterLink} to="/" leftIcon={<ArrowBackIcon />} variant="link">На головну</Button>
         </Center>
      </Box>
     );
  }

  // Если все хорошо, показываем публичный список
  return (
    <Box bg={bg} minH="100vh" py={10} px={4}>
      <Box maxW="6xl" mx="auto">
        <Heading as="h1" size="xl" mb={2}>
          {listData.name}
        </Heading>
        <Text color="gray.500" mb={6}>
          Публічний список {/* Можно добавить имя автора, если бэкенд его отдает */}
        </Text>

        {listData.movies.length === 0 ? (
          <Text>Цей список порожній.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
            {listData.movies.map((movie) => (
              <MovieCard
                  key={movie.movieId}
                  movie={movie}
                  // НЕ передаем showRating={true}, чтобы скрыть звезды и кнопки
                  // onClickCard можно настроить, но без интерактива
                   onClickCard={() => {}} // Пустой обработчик
                />
            ))}
          </SimpleGrid>
        )}
         <Center mt={8}>
            <Button as={RouterLink} to="/" variant="outline">На головну</Button>
         </Center>
      </Box>
    </Box>
  );
}