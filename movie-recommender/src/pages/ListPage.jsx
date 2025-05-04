// src/pages/ListPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Box, Heading, Spinner, Alert, AlertIcon, SimpleGrid, Text, Center, Button, IconButton, useToast, Link, Divider
  // useColorModeValue убран
} from "@chakra-ui/react";
import { ArrowBackIcon, DeleteIcon } from "@chakra-ui/icons";
import MovieCard from "../components/MovieCard"; // MovieCard стилизуется отдельно

export default function ListPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [listData, setListData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingMovieId, setDeletingMovieId] = useState(null);
  const toast = useToast();
  // const bg = useColorModeValue("gray.100", "gray.800"); // Убран

  // Состояния для рекомендаций
  const [listRecommendations, setListRecommendations] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [errorRecs, setErrorRecs] = useState(null);

  // Загрузка деталей списка
  const fetchListDetails = useCallback(async () => {
    // ... (логика без изменений) ...
     setIsLoading(true); setError(null); setListRecommendations([]); setErrorRecs(null);
    const token = localStorage.getItem("token");
    if (!token) { setError("Помилка аутентифікації."); setIsLoading(false); return; }
     try {
      const response = await axios.get(`/api/lists/${listId}`, { headers: { Authorization: `Bearer ${token}` } });
      setListData(response.data);
      if (response.data?.movies?.length > 0) { fetchListRecommendations(listId, token); }
    } catch (err) {
      const errorDesc = err.response?.data?.description || "Не вдалося завантажити список.";
      setError(`Не вдалося завантажити список (ID: ${listId}). ${errorDesc}`); setListData(null);
      console.error("Fetch list details error:", err.response?.data || err);
    } finally { setIsLoading(false); }
  }, [listId]); // Добавил fetchListRecommendations в зависимости

  // Загрузка рекомендаций
  const fetchListRecommendations = useCallback(async (currentListId, token) => {
    // ... (логика без изменений) ...
    console.log(`Workspaceing recommendations for list ${currentListId}`);
    setIsLoadingRecs(true); setErrorRecs(null);
    try {
      const recsResponse = await axios.get(`/api/recommend/list/${currentListId}?n=10`, { headers: { Authorization: `Bearer ${token}` } });
      setListRecommendations(recsResponse.data);
      console.log("List recommendations received:", recsResponse.data);
    } catch (err) {
      setErrorRecs("Не вдалося завантажити рекомендації для цього списку.");
      console.error("Fetch list recommendations error:", err.response?.data || err);
    } finally { setIsLoadingRecs(false); }
  }, []);

  useEffect(() => { fetchListDetails(); }, [fetchListDetails]);

  // Удаление фильма
  const handleDeleteMovie = useCallback(async (movieId, movieTitle) => {
     // ... (логика без изменений) ...
      if (!window.confirm(`Ви впевнені, що хочете видалити фільм "${movieTitle}" зі списку "${listData?.name}"?`)) { return; }
    setDeletingMovieId(movieId); setError(null);
    const token = localStorage.getItem("token");
    if (!token) { toast({ title: "Помилка аутентифікації", status: "error", duration: 3000, isClosable: true }); setDeletingMovieId(null); return; }
     try {
      await axios.delete(`/api/lists/${listId}/movies/${movieId}`, { headers: { Authorization: `Bearer ${token}` } });
      setListData((prevData) => ({ ...prevData, movies: prevData.movies.filter((movie) => movie.movieId !== movieId) }));
      toast({ title: `Фільм "${movieTitle}" видалено зі списку.`, status: "info", duration: 3000, isClosable: true });
    } catch (err) {
      const errorMsg = err.response?.data?.description || err.response?.data?.message || "Не вдалося видалити фільм.";
      toast({ title: "Помилка видалення фільму", description: errorMsg, status: "error", duration: 5000, isClosable: true });
      console.error("Delete movie from list error:", err.response?.data || err);
    } finally { setDeletingMovieId(null); }
  }, [listId, listData?.name, toast]);

  // --- Рендеринг ---
  if (isLoading) { return ( <Center h="calc(100vh - 70px)"> <Spinner size="xl" color="brand.gold"/> </Center> ); }

  if (error) {
    return (
      <Box minH="calc(100vh - 70px)" py={10} px={4}>
         <Alert status="error" maxW="xl" mx="auto" borderRadius="md" variant="subtle"> <AlertIcon /> {error} </Alert>
         <Center mt={4}><Button leftIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} variant="outline" borderColor="brand.gold" color="brand.gold" _hover={{bg: "whiteAlpha.100"}}>До списків</Button></Center>
      </Box>
    );
  }

  if (!listData) { return ( /* ... обработка пустого listData ... */ <Text>Список не знайдено.</Text>); }

  return (
    // Убираем bg
    <Box minH="calc(100vh - 70px)" py={10} px={4}>
      <Box maxW="6xl" mx="auto">
        <Button leftIcon={<ArrowBackIcon />} mb={4} onClick={() => navigate(-1)} variant="ghost" color="gray.400" _hover={{color:"white"}}>
          До списків
        </Button>
        <Heading as="h1" size="xl" mb={6} color="brand.gold" textAlign="center"> {/* Золотой заголовок */}
          {listData.name}
        </Heading>

        {/* Фильмы в списке */}
        {listData.movies.length === 0 ? (
          <Text textAlign="center" color="gray.400">Цей список порожній.</Text>
        ) : (
           // Увеличили кол-во колонок
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing={6}>
            {listData.movies.map((movie) => (
              <Box key={movie.movieId} pos="relative" role="group">
                {/* MovieCard стилизуется отдельно */}
                <MovieCard movie={movie} showRating onClickCard={() => { /* alert(`Фильм ${movie.movieId}`) */ }} />
                <IconButton
                  aria-label={`Видалити ${movie.title} зі списку`} icon={<DeleteIcon />} size="xs" colorScheme="red" variant="solid" isRound
                  pos="absolute" top="8px" right="8px" zIndex="docked" boxShadow="md"
                  opacity={0} _groupHover={{ opacity: 1 }} transition="opacity 0.2s ease-in-out"
                  onClick={(e) => { e.stopPropagation(); handleDeleteMovie(movie.movieId, movie.title); }}
                  isLoading={deletingMovieId === movie.movieId} isDisabled={deletingMovieId !== null}
                />
              </Box>
            ))}
          </SimpleGrid>
        )}

        {/* Рекомендации на основе списка */}
        {listData.movies.length > 0 && (
            <>
                <Divider my={10} borderColor="whiteAlpha.300" /> {/* Разделитель */}
                <Heading as="h2" size="lg" mb={6} textAlign="center" color="brand.gold" fontWeight="semibold"> {/* Золотой подзаголовок */}
                    Можливо, вам сподобається:
                </Heading>
                {errorRecs && ( <Alert status="warning" mb={4} borderRadius="md" variant="subtle"> <AlertIcon /> {errorRecs} </Alert> )}

                {isLoadingRecs ? (
                    <Center py={5}> <Spinner color="brand.gold"/> </Center>
                ) : listRecommendations.length === 0 && !errorRecs ? (
                    <Text textAlign="center" color="gray.400">Немає доступних рекомендацій для цього списку.</Text>
                ) : (
                     // Увеличили кол-во колонок
                    <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing={6}>
                        {listRecommendations.map((recMovie) => (
                            <MovieCard key={`rec-${recMovie.movieId}`} movie={recMovie} showRating onClickCard={() => { /* alert(`Фильм ${recMovie.movieId}`) */ }} />
                        ))}
                    </SimpleGrid>
                )}
            </>
        )}
      </Box>
    </Box>
  );
}