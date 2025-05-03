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
  useColorModeValue, // Добавим для фона
  List,            // Для списка избранного
  ListItem,        // Для элемента списка
} from "@chakra-ui/react";
// useNavigate больше не нужен здесь для выхода
// import { useNavigate } from "react-router-dom";
// authHeaders тоже не нужен, используем токен напрямую
// import { authHeaders } from "../config";

// Компонент теперь принимает user и onLogout из App.jsx
export default function Profile({ user, onLogout }) {
  // Убираем локальное состояние user, используем проп
  // const [user, setUser] = useState(null);
  const [favs, setFavs] = useState(null); // Оставляем состояние для избранного
  const [loadingFavs, setLoadingFavs] = useState(true); // Состояние загрузки избранного
  const [error, setError] = useState(null);

  // Стили фона
  const bg = useColorModeValue("gray.100", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");

  useEffect(() => {
    // Убираем проверку токена и пользователя из localStorage - ProtectedRoute уже это сделал
    // const token = localStorage.getItem("token");
    // const u = JSON.parse(localStorage.getItem("user") || "null");
    // if (!token || !u) {
    //   navigate("/login"); // Это больше не нужно
    //   return;
    // }
    // setUser(u); // Используем user из пропсов

    // Загружаем избранное, если пользователь определен
    if (user) {
      const token = localStorage.getItem("token"); // Токен все еще нужен для запроса
      if (!token) { // Доп. проверка на случай рассинхрона
          setError("Помилка аутентифікації для завантаження улюблених.");
          setLoadingFavs(false);
          return;
      }
      setLoadingFavs(true); // Начинаем загрузку избранного
      axios
        .get("/api/recommend/user/favorites", {
          // Используем authHeaders или напрямую токен
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          setFavs(res.data);
          setError(null); // Сбрасываем ошибку, если была
        })
        .catch(() => {
          setError("Не вдалося завантажити улюблені фільми.");
          setFavs([]); // Устанавливаем пустой массив при ошибке
        })
        .finally(() => {
          setLoadingFavs(false); // Завершаем загрузку
        });
    } else {
        // Если пользователя нет (теоретически не должно случиться из-за ProtectedRoute)
        setLoadingFavs(false);
        setFavs([]);
    }
  // Зависимость от user.id, чтобы перезагрузить избранное, если пользователь сменится
  // (хотя в текущей архитектуре это маловероятно без перезагрузки страницы)
  }, [user]);

  // Функция выхода теперь просто вызывает пропс
  // const handleLogout = () => {
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("user");
  //   localStorage.removeItem("user_id");
  //   navigate("/"); // Перенаправление теперь произойдет в App.jsx или NavBar
  // };

  // Если user еще не пришел из App.jsx (хотя ProtectedRoute должен это предотвратить)
  if (!user) {
    return (
      <Center h="80vh"> {/* Используем Center */}
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box bg={bg} minH="calc(100vh - 70px)" py={10} px={4}> {/* Добавил фон и отступы */}
      <Box
        maxW="lg" // Увеличил ширину
        mx="auto"
        p={8} // Увеличил padding
        bg={cardBg} // Фон карточки
        borderWidth="1px"
        borderRadius="lg" // Сделал скругление больше
        boxShadow="lg" // Добавил тень
      >
        <VStack spacing={6} align="start" w="100%"> {/* Увеличил spacing */}
          <Heading as="h1" size="lg">Профіль користувача</Heading>

          {/* Отображаем информацию из user пропа */}
          <Box>
            <Text fontSize="lg">
              <b>Ім’я:</b> {user.name}
            </Text>
            <Text fontSize="lg">
              <b>Електронна пошта:</b> {user.email}
            </Text>
          </Box>

          <Heading size="md" mt={4} borderBottomWidth="1px" pb={2} w="100%">
            Улюблені фільми
          </Heading>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon /> {error}
            </Alert>
          )}

          {loadingFavs ? (
            <Spinner size="md" />
          ) : favs && favs.length === 0 ? (
            <Text>Список улюблених фільмів порожній.</Text>
          ) : favs && favs.length > 0 ? (
            // Используем List для семантики
            <List spacing={2} w="100%">
              {favs.map((m) => (
                // Можно сделать ссылки на фильмы, если есть ID/путь
                <ListItem key={m.movieId}>• {m.title}</ListItem>
              ))}
            </List>
          ) : null /* Ничего не показываем, если favs еще null и не загружается */ }

          {/* Кнопка выхода теперь вызывает onLogout из пропсов */}
          <Button colorScheme="red" variant="outline" onClick={onLogout} mt={6} alignSelf="flex-start">
            Вийти з профілю
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}