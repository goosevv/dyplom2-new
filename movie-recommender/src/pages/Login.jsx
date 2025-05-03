// src/pages/Login.jsx
import React, { useState } from "react";
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  useColorModeValue,
  Heading, // Добавим заголовок
} from "@chakra-ui/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Компонент теперь принимает onLoginSuccess как проп
export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const bg = useColorModeValue("white", "gray.700");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/auth/login", { email, password });
      // <<< ВЫЗЫВАЕМ ФУНКЦИЮ ИЗ APP.JSX >>>
      // Передаем ей данные пользователя и токен из ответа API
      onLoginSuccess(res.data.user, res.data.access_token);

      // Перенаправление оставляем здесь, т.к. App уже обновил state
      navigate("/recommendations");

    } catch (err) {
      setError(
        err.response?.data?.message || "Помилка входу — перевірте логін/пароль."
      );
      // При ошибке НЕ вызываем onLoginSuccess
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      maxW="md"
      mx="auto"
      mt={12}
      p={6}
      bg={bg}
      borderRadius="md"
      boxShadow="lg">
      <Heading as="h2" size="lg" textAlign="center" mb={6}>
        Вхід
      </Heading>
      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon /> {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl id="email-login" isRequired> {/* Изменил id на всякий случай */}
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </FormControl>

          <FormControl id="password-login" isRequired> {/* Изменил id */}
            <FormLabel>Пароль</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </FormControl>

          <Button type="submit" colorScheme="blue" w="100%" isLoading={loading} mt={4}>
            Увійти
          </Button>
        </VStack>
      </form>
    </Box>
  );
}