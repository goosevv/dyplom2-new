// src/pages/Favorites.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box, Heading, SimpleGrid, Spinner, Alert, AlertIcon, Text, Center
  // useColorModeValue убран
} from "@chakra-ui/react";
import MovieCard from "../components/MovieCard";
// import { authHeaders } from "../config"; // Не используется

export default function Favorites() {
  const [favs, setFavs] = useState(null);
  const [error, setError] = useState(null);
  // const bg = useColorModeValue("gray.50", "gray.800"); // Убран

  useEffect(() => {
    const token = localStorage.getItem("token");
    // Добавим проверку токена перед запросом
    if (!token) {
        setError("Будь ласка, увійдіть, щоб побачити улюблені.");
        setFavs([]); // Устанавливаем пустой массив
        return;
    }
    axios
      .get("/api/recommend/user/favorites", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setFavs(res.data))
      .catch(() => setError("Не вдалося завантажити улюблені"));
  }, []);


  if (error) {
    return (
      <Center minH="calc(100vh - 70px)">
        <Alert status="error" variant="subtle" borderRadius="md">
          <AlertIcon /> {error}
        </Alert>
      </Center>
    );
  }
  if (favs === null) { // Пока идет загрузка (favs === null)
    return <Center minH="calc(100vh - 70px)"><Spinner size="xl" color="brand.gold" /></Center>;
  }
  if (favs.length === 0) {
    return <Center minH="calc(100vh - 70px)"><Text fontSize="xl">У вас ще немає улюблених фільмів</Text></Center>;
  }

  return (
    // Убираем bg
    <Box minH="calc(100vh - 70px)" p={6}>
      <Heading as="h1" mb={6} color="brand.gold" textAlign="center"> {/* Золотой заголовок */}
        Улюблені фільми
      </Heading>
      {/* Увеличили количество колонок */}
      <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing={6} alignItems="stretch">
        {favs.map((movie) => (
          // Предполагаем, что MovieCard адаптируется к фону или стилизуется отдельно
          <MovieCard key={movie.movieId} movie={movie} showRating />
        ))}
      </SimpleGrid>
    </Box>
  );
}