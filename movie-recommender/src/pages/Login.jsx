// src/pages/Login.jsx
import React, { useState } from "react";
import {
  Box, VStack, FormControl, FormLabel, Input, Button, Alert, AlertIcon, Heading, Center
  // useColorModeValue убран, т.к. фон задан глобально
} from "@chakra-ui/react";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom"; // Добавлен RouterLink

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  // const bg = useColorModeValue("white", "gray.700"); // Убрано
  // Используем полупрозрачный фон для карточки
  const cardBg = "whiteAlpha.100";

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
      onLoginSuccess(res.data.user, res.data.access_token);
      navigate("/recommendations");
    } catch (err) {
      setError( err.response?.data?.message || "Помилка входу — перевірте логін/пароль." );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center minH="calc(100vh - 70px)" px={4}> {/* Центрируем форму */}
      <Box
        maxW="md"
        w="100%" // Занимаем всю ширину на малых экранах
        // mt={12} // Убираем верхний отступ, т.к. центрируем
        p={8} // Увеличили паддинг
        bg={cardBg} // Используем полупрозрачный фон
        borderRadius="xl" // Более скругленные углы
        boxShadow="lg"
      >
        <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.gold"> {/* Золотой заголовок */}
          Вхід
        </Heading>
        {error && (
          <Alert status="error" mb={4} borderRadius="md" variant="subtle">
            <AlertIcon /> {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <VStack spacing={5} align="stretch"> {/* Увеличили spacing */}
            <FormControl id="email-login" isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                // Стилизация Input
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
                _hover={{ borderColor: "whiteAlpha.400" }}
                focusBorderColor="brand.gold"
                _placeholder={{ color: "gray.500" }}
              />
            </FormControl>

            <FormControl id="password-login" isRequired>
              <FormLabel>Пароль</FormLabel>
              <Input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                 // Стилизация Input
                 bg="whiteAlpha.100"
                 borderColor="whiteAlpha.300"
                 _hover={{ borderColor: "whiteAlpha.400" }}
                 focusBorderColor="brand.gold"
                 _placeholder={{ color: "gray.500" }}
              />
            </FormControl>

            <Button
              type="submit"
              w="100%" isLoading={loading} mt={4} size="lg" // Увеличили кнопку
              // Стилизация основной кнопки
              bg="brand.gold" color="brand.purple" _hover={{ bg: "brand.goldHover" }}
            >
              Увійти
            </Button>

            {/* Ссылка на регистрацию */}
             <Button as={RouterLink} to="/register" variant="link" colorScheme="gray" size="sm" mt={2}>
                Немає акаунту? Зареєструватися
            </Button>
          </VStack>
        </form>
      </Box>
    </Center>
  );
}