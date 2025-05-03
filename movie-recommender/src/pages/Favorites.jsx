// src/pages/Favorites.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import MovieCard from "../components/MovieCard";
import { authHeaders } from "../config";

export default function Favorites() {
  const [favs, setFavs] = useState(null);
  const [error, setError] = useState(null);
  const bg = useColorModeValue("gray.50", "gray.800");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("/api/recommend/user/favorites", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setFavs(res.data))
      .catch(() => setError("Не вдалося завантажити улюблені"));
  }, []);
  

  if (error) {
    return (
      <Alert status="error" mt={4}>
        <AlertIcon /> {error}
      </Alert>
    );
  }
  if (favs === null) {
    return <Spinner size="lg" mt={8} />;
  }
  if (favs.length === 0) {
    return <Text mt={8}>У вас немає улюблених фільмів</Text>;
  }

  return (
    <Box bg={bg} minH="100vh" p={4}>
      <Heading mb={4}>Улюблені фільми</Heading>
      <SimpleGrid
        columns={{ base: 1, sm: 2, md: 3 }}
        spacing={6}
        alignItems="stretch">
        {favs.map((movie) => (
          <MovieCard key={movie.movieId} movie={movie} />
        ))}
      </SimpleGrid>
    </Box>
  );
}
