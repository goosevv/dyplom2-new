// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Heading, Text, Button, VStack, Alert, AlertIcon, Spinner, List, ListItem, Center, Divider
  // useColorModeValue убран
} from "@chakra-ui/react";

export default function Profile({ user, onLogout }) {
  const [favs, setFavs] = useState(null);
  const [loadingFavs, setLoadingFavs] = useState(true);
  const [error, setError] = useState(null);

  // const bg = useColorModeValue("gray.100", "gray.800"); // Убрано
  const cardBg = "whiteAlpha.100"; // Полупрозрачный фон для карточки

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("token");
      if (!token) {
          setError("Помилка аутентифікації для завантаження улюблених.");
          setLoadingFavs(false);
          setFavs([]);
          return;
      }
      setLoadingFavs(true);
      setError(null);
      axios
        .get("/api/recommend/user/favorites", {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => { setFavs(res.data); })
        .catch(() => {
          setError("Не вдалося завантажити улюблені фільми.");
          setFavs([]);
        })
        .finally(() => { setLoadingFavs(false); });
    } else {
        setLoadingFavs(false);
        setFavs([]);
    }
  }, [user]);

  if (!user) {
    return (
      <Center h="calc(100vh - 70px)">
        <Spinner size="xl" color="brand.gold"/>
      </Center>
    );
  }

  return (
    // Используем Box без явного bg, т.к. фон глобальный
    <Box minH="calc(100vh - 70px)" py={10} px={4}>
      <Box
        maxW="lg" mx="auto"
        p={8} bg={cardBg} borderWidth="1px" borderColor="whiteAlpha.200" // Добавили рамку
        borderRadius="xl" boxShadow="lg" // Увеличили скругление
      >
        <VStack spacing={6} align="stretch" w="100%"> {/* align="stretch" */}
          <Heading as="h1" size="xl" color="brand.gold" textAlign="center" mb={4}> {/* Золотой заголовок */}
            Профіль користувача
          </Heading>

          {/* Информация о пользователе */}
          <VStack spacing={1} align="start" w="100%" bg="whiteAlpha.50" p={4} borderRadius="md"> {/* Фон для блока инфо */}
            <Text fontSize="lg">
              <b>Ім’я:</b> {user.name}
            </Text>
            <Divider my={1}/> {/* Разделитель */}
            <Text fontSize="lg">
              <b>Email:</b> {user.email}
            </Text>
             <Text fontSize="sm" color="gray.500" pt={1}>
              User ID: {user.id}
            </Text>
          </VStack>

          <Heading size="lg" mt={4} pb={2} w="100%" borderBottomWidth="1px" borderColor="brand.gold"> {/* Золотой подзаголовок */}
            Улюблені фільми
          </Heading>

          {error && (
            <Alert status="error" borderRadius="md" variant="subtle">
              <AlertIcon /> {error}
            </Alert>
          )}

          {loadingFavs ? (
            <Center><Spinner size="md" color="brand.gold" /></Center>
          ) : favs && favs.length === 0 ? (
            <Text color="gray.400">Список улюблених фільмів порожній.</Text>
          ) : favs && favs.length > 0 ? (
            <List spacing={2} w="100%" pl={4}> {/* Добавили отступ слева для маркеров */}
              {favs.map((m) => (
                <ListItem key={m.movieId}> {m.title} </ListItem> // Убрали маркер, т.к. он может быть не виден
              ))}
            </List>
          ) : (
            !error && <Text color="gray.400">Не вдалося завантажити список.</Text>
          )}

          {/* Кнопка выхода */}
          <Button colorScheme="red" variant="outline" onClick={onLogout} mt={6} alignSelf="center"> {/* Центрируем кнопку */}
            Вийти з профілю
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}