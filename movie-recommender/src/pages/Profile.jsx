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
  useColorModeValue,
  List,
  ListItem,
  Center // Импортируем Center для спиннера
} from "@chakra-ui/react";
// useNavigate больше не нужен здесь для выхода и проверки
// import { useNavigate } from "react-router-dom";
// authHeaders тоже не нужен, если используем токен напрямую
// import { authHeaders } from "../config";

// Компонент теперь принимает user и onLogout из App.jsx
export default function Profile({ user, onLogout }) {
  // Убираем локальное состояние user, используем проп
  // const navigate = useNavigate(); // Убираем
  // const [user, setUser] = useState(null); // Убираем

  const [favs, setFavs] = useState(null); // Оставляем состояние для избранного
  const [loadingFavs, setLoadingFavs] = useState(true); // Состояние загрузки избранного
  const [error, setError] = useState(null);

  // Стили фона
  const bg = useColorModeValue("gray.100", "gray.800"); // Фон для всей страницы
  const cardBg = useColorModeValue("white", "gray.700"); // Фон для карточки профиля

  useEffect(() => {
    // Убираем проверку токена и пользователя из localStorage - ProtectedRoute уже это сделал
    // if (!token || !u) { navigate("/login"); return; }
    // setUser(u); // Используем user из пропсов

    // Загружаем избранное, только если проп user существует
    if (user) {
      const token = localStorage.getItem("token"); // Токен все еще нужен для запроса
      if (!token) { // Доп. проверка на случай рассинхрона
          setError("Помилка аутентифікації для завантаження улюблених.");
          setLoadingFavs(false);
          setFavs([]); // Устанавливаем пустой массив
          return;
      }
      setLoadingFavs(true);
      setError(null); // Сбрасываем ошибку перед запросом
      axios
        .get("/api/recommend/user/favorites", {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          setFavs(res.data);
        })
        .catch(() => {
          setError("Не вдалося завантажити улюблені фільми.");
          setFavs([]); // Устанавливаем пустой массив при ошибке
        })
        .finally(() => {
          setLoadingFavs(false);
        });
    } else {
        // Если пользователя нет (теоретически не должно случиться из-за ProtectedRoute)
        setLoadingFavs(false);
        setFavs([]);
    }
  // Зависимость от user (или user.id), чтобы перезагрузить данные при его изменении
  // Но т.к. user передается из App, изменение будет при смене пользователя (логаут/логин)
  }, [user]);

  // Убираем локальную функцию handleLogout
  // const handleLogout = () => { ... };

  // Если user еще null (хотя ProtectedRoute должен это предотвратить),
  // показываем загрузчик на всю страницу
  if (!user) {
    return (
      <Center h="calc(100vh - 70px)"> {/* Занимаем доступную высоту */}
        <Spinner size="xl" />
      </Center>
    );
  }

  // Основной рендеринг, когда user точно есть
  return (
    <Box bg={bg} minH="calc(100vh - 70px)" py={10} px={4}>
      <Box
        maxW="lg"
        mx="auto"
        p={8}
        bg={cardBg}
        borderWidth="1px"
        borderRadius="lg"
        boxShadow="lg"
      >
        <VStack spacing={6} align="start" w="100%">
          <Heading as="h1" size="lg">Профіль користувача</Heading>

          {/* Информация о пользователе из пропа user */}
          <Box>
            <Text fontSize="lg">
              <b>Ім’я:</b> {user.name}
            </Text>
            <Text fontSize="lg">
              <b>Електронна пошта:</b> {user.email}
            </Text>
            <Text fontSize="sm" color="gray.500">
              User ID: {user.id} {/* Можно показывать ID для отладки */}
            </Text>
          </Box>

          <Heading size="md" mt={4} borderBottomWidth="1px" pb={2} w="100%">
            Улюблені фільми
          </Heading>

          {/* Отображение ошибок */}
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon /> {error}
            </Alert>
          )}

          {/* Отображение избранного */}
          {loadingFavs ? (
            <Spinner size="md" />
          ) : favs && favs.length === 0 ? (
            <Text>Список улюблених фільмів порожній.</Text>
          ) : favs && favs.length > 0 ? (
            <List spacing={2} w="100%">
              {favs.map((m) => (
                <ListItem key={m.movieId}>• {m.title}</ListItem>
              ))}
            </List>
          ) : (
            !error && <Text>Не вдалося завантажити список.</Text> // Если не грузится и не ошибка
          )}

          {/* Кнопка выхода теперь вызывает onLogout из пропсов */}
          <Button colorScheme="red" variant="outline" onClick={onLogout} mt={6} alignSelf="flex-start">
            Вийти з профілю
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}