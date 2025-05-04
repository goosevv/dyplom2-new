// src/pages/ListPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom"; // Добавили RouterLink
import axios from "axios";
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
  IconButton, // <<< Убедитесь, что импортирован
  useToast, // <<< Убедитесь, что импортирован
  Link,
  Divider,
} from "@chakra-ui/react";
import { ArrowBackIcon, DeleteIcon } from "@chakra-ui/icons";
import MovieCard from "../components/MovieCard"; // Используем нашу MovieCard

export default function ListPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [listData, setListData] = useState(null); // { id, name, movies: [] }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingMovieId, setDeletingMovieId] = useState(null); // Для индикации удаления фильма
  const toast = useToast();
  const bg = useColorModeValue("gray.100", "gray.800");

  // --- НОВОЕ: Состояния для рекомендаций ---
  const [listRecommendations, setListRecommendations] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [errorRecs, setErrorRecs] = useState(null);
  // --- Конец нового состояния ---

  // Функция загрузки данных списка
  const fetchListDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setListRecommendations([]); // Сбрасываем старые рекомендации при загрузке основного списка
    setErrorRecs(null); // Сбрасываем ошибки рекомендаций
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Помилка аутентифікації.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`/api/lists/${listId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListData(response.data);
      // !!! Запускаем загрузку рекомендаций ПОСЛЕ успешной загрузки основного списка !!!
      // Но только если список не пустой
      if (response.data?.movies?.length > 0) {
        fetchListRecommendations(listId, token); // Вызываем новую функцию
      }
    } catch (err) {
      const errorDesc =
        err.response?.data?.description || "Не вдалося завантажити список.";
      setError(`Не вдалося завантажити список (ID: ${listId}). ${errorDesc}`);
      setListData(null);
      console.error("Fetch list details error:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  }, [listId]);

  // --- НОВАЯ Функция загрузки рекомендаций ---
  const fetchListRecommendations = useCallback(async (currentListId, token) => {
    console.log(`Workspaceing recommendations for list ${currentListId}`);
    setIsLoadingRecs(true);
    setErrorRecs(null);
    try {
      // Запрашиваем чуть больше, например 10, чтобы показать 2 ряда по 5 или 4
      const recsResponse = await axios.get(
        `/api/recommend/list/${currentListId}?n=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setListRecommendations(recsResponse.data);
      console.log("List recommendations received:", recsResponse.data);
    } catch (err) {
      setErrorRecs("Не вдалося завантажити рекомендації для цього списку.");
      console.error(
        "Fetch list recommendations error:",
        err.response?.data || err
      );
    } finally {
      setIsLoadingRecs(false);
    }
  }, []); // Пустой массив зависимостей, т.к. параметры передаются явно

  // Загружаем данные при монтировании или смене listId
  useEffect(() => {
    fetchListDetails();
  }, [fetchListDetails]);

  // --- РАСКОММЕНТИРУЕМ И РЕАЛИЗУЕМ Функцию удаления фильма из списка ---
  const handleDeleteMovie = useCallback(async (movieId, movieTitle) => {
    // Добавим подтверждение
    if (
      !window.confirm(
        `Ви впевнені, що хочете видалити фільм "${movieTitle}" зі списку "${listData?.name}"?`
      )
    ) {
      return;
    }

    setDeletingMovieId(movieId); // Показываем спиннер на кнопке
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Помилка аутентифікації",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setDeletingMovieId(null);
      return;
    }

    try {
      // Отправляем DELETE запрос на бэкенд
      await axios.delete(`/api/lists/${listId}/movies/${movieId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Обновляем состояние movies в listData, убирая удаленный фильм
      setListData((prevData) => ({
        ...prevData,
        movies: prevData.movies.filter((movie) => movie.movieId !== movieId),
      }));

      toast({
        title: `Фільм "${movieTitle}" видалено зі списку.`,
        status: "info", // Используем info или success
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.description ||
        err.response?.data?.message ||
        "Не вдалося видалити фільм.";
      toast({
        title: "Помилка видалення фільму",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Delete movie from list error:", err.response?.data || err);
      // Можно добавить setError(errorMsg), если нужно показать ошибку на странице
    } finally {
      setDeletingMovieId(null); // Убираем спиннер с кнопки
    }
  }, [listId, listData?.name, toast]);
  // --- Конец функции удаления ---

  // --- Рендеринг ---

  if (isLoading) {
    return (
      <Center h="calc(100vh - 70px)">
        {" "}
        <Spinner size="xl" />{" "}
      </Center>
    );
  }

  if (error) {
    return (
      <Box bg={bg} minH="calc(100vh - 70px)" py={10} px={4}>
        <Alert status="error" maxW="xl" mx="auto" borderRadius="md">
          {" "}
          <AlertIcon /> {error}{" "}
        </Alert>
        <Button
          leftIcon={<ArrowBackIcon />}
          mt={4}
          onClick={() => navigate(-1)}
          variant="outline">
          До списків
        </Button>
      </Box>
    );
  }

  // Добавили проверку !listData на случай, если fetch завершился без ошибки, но данных нет
  if (!listData) {
    return (
      <Box bg={bg} minH="calc(100vh - 70px)" py={10} px={4}>
        <Text textAlign="center">Список не знайдено або порожній.</Text>
        <Button
          leftIcon={<ArrowBackIcon />}
          mt={4}
          onClick={() => navigate(-1)}
          variant="outline">
          До списків
        </Button>
      </Box>
    );
  }

  // Если все хорошо, показываем список
  return (
    <Box bg={bg} minH="calc(100vh - 70px)" py={10} px={4}>
      <Box maxW="6xl" mx="auto">
        <Button
          leftIcon={<ArrowBackIcon />}
          mb={4}
          onClick={() => navigate(-1)}
          variant="ghost">
          До списків
        </Button>
        <Heading as="h1" size="xl" mb={6}>
          {listData.name}
        </Heading>

        {listData.movies.length === 0 ? (
          <Text>Цей список порожній.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
            {" "}
            {/* Добавил xl */}
            {listData.movies.map((movie) => (
              <Box key={movie.movieId} pos="relative" role="group">
                {" "}
                {/* Добавил role="group" для hover эффекта */}
                <MovieCard
                  movie={movie}
                  showRating // Показываем рейтинг и здесь
                  // Можно сделать карточку некликабельной здесь или чтобы вела на стр. фильма
                  onClickCard={() =>
                    alert(`Переход на страницу фильма ${movie.movieId}`)
                  } // Пример заглушки
                />
                {/* РАСКОММЕНТИРУЕМ Кнопку удаления фильма */}
                <IconButton
                  aria-label={`Видалити ${movie.title} зі списку`}
                  icon={<DeleteIcon />}
                  size="xs"
                  colorScheme="red"
                  variant="solid"
                  isRound
                  pos="absolute"
                  top="8px"
                  right="8px"
                  zIndex="docked"
                  boxShadow="md"
                  // Показываем кнопку только при наведении на родительский Box
                  opacity={0}
                  _groupHover={{ opacity: 1 }} // Используем _groupHover
                  transition="opacity 0.2s ease-in-out"
                  // Вызываем handleDeleteMovie при клике
                  onClick={(e) => {
                    e.stopPropagation(); // Останавливаем клик по карточке
                    handleDeleteMovie(movie.movieId, movie.title);
                  }}
                  isLoading={deletingMovieId === movie.movieId} // Индикатор загрузки
                  isDisabled={deletingMovieId !== null} // Блокируем другие во время удаления
                />
              </Box>
            ))}
          </SimpleGrid>
        )}
                {/* --- НОВЫЙ БЛОК: Рекомендации на основе списка --- */}
                {listData.movies.length > 0 && ( // Показываем только если исходный список не пуст
            <> {/* Используем фрагмент */}
                <Divider my={8} /> {/* Разделитель */}
                <Heading as="h2" size="lg" mb={4}>
                    Можливо, вам сподобається:
                </Heading>

                {/* Ошибка загрузки рекомендаций */}
                {errorRecs && (
                    <Alert status="warning" mb={4} borderRadius="md"> <AlertIcon /> {errorRecs} </Alert>
                )}

                {/* Загрузка рекомендаций */}
                {isLoadingRecs ? (
                    <Center py={5}> <Spinner /> </Center>
                ) : listRecommendations.length === 0 && !errorRecs ? (
                    <Text>Немає доступних рекомендацій для цього списку.</Text>
                ) : (
                    // Сетка с рекомендациями
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                        {listRecommendations.map((recMovie) => (
                            <MovieCard
                                key={`rec-${recMovie.movieId}`} // Добавляем префикс к key
                                movie={recMovie} // Передаем рекомендованный фильм
                                showRating // Можно показывать/скрывать рейтинг
                                onClickCard={() => alert(`Переход на страницу фильма ${recMovie.movieId}`)}
                            />
                        ))}
                    </SimpleGrid>
                )}
            </>
        )}
        {/* --- Конец блока рекомендаций --- */}
      </Box>
    </Box>
  );
}
