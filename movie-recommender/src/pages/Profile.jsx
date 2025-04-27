// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Alert,
  AlertIcon,
  Spinner,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { authHeaders } from "../config";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [favs, setFavs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || !u) {
      navigate("/login");
      return;
    }
    setUser(u);

    axios
      .get("/api/recommend/user/favorites", authHeaders())
      .then((res) => setFavs(res.data))
      .catch(() => setError("Не вдалося завантажити улюблені"));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_id");
    navigate("/");
  };

  return (
    <Box maxW="md" mx="auto" mt={12} p={6} borderWidth="1px" borderRadius="md">
      <VStack spacing={4} align="start">
        <Heading>Профіль</Heading>

        {error && (
          <Alert status="error">
            <AlertIcon /> {error}
          </Alert>
        )}

        {!user ? (
          <Spinner size="lg" />
        ) : (
          <>
            <Text>
              <b>Ім’я:</b> {user.name}
            </Text>
            <Text>
              <b>Електронна пошта:</b> {user.email}
            </Text>

            <Heading size="md" mt={4}>
              Улюблені фільми
            </Heading>
            {favs === null ? (
              <Spinner size="sm" />
            ) : favs.length === 0 ? (
              <Text>У вас немає улюблених фільмів</Text>
            ) : (
              favs.map((m) => <Text key={m.movieId}>• {m.title}</Text>)
            )}

            <Button colorScheme="red" variant="outline" onClick={handleLogout}>
              Вийти
            </Button>
          </>
        )}
      </VStack>
    </Box>
  );
}
