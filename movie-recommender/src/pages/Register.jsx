// src/pages/Register.jsx
import React, { useState } from 'react';
import {
  Box, VStack, FormControl, FormLabel, Input, Button, Alert, AlertIcon, Heading, Center
  // useColorModeValue убран
} from '@chakra-ui/react';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // Добавлен RouterLink

export default function Register() {
  const navigate = useNavigate();
  // const bg = useColorModeValue('white', 'gray.700'); // Убрано
  const cardBg = "whiteAlpha.100"; // Полупрозрачный фон

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/auth/register', { name, email, password });
      // Можно добавить toast об успехе
      navigate('/login'); // Перенаправляем на логин после регистрации
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка реєстрації — спробуйте пізніше.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center minH="calc(100vh - 70px)" px={4}> {/* Центрируем */}
      <Box
        maxW="md" w="100%"
        // mt={12} // Убрано
        p={8} bg={cardBg} borderRadius="xl" boxShadow="lg"
      >
        <Heading as="h1" size="xl" textAlign="center" mb={8} color="brand.gold"> {/* Золотой заголовок */}
          Реєстрація
        </Heading>
        {error && (
          <Alert status="error" mb={4} variant="subtle" borderRadius="md">
            <AlertIcon /> {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <VStack spacing={5} align="stretch"> {/* Увеличили spacing */}
            <FormControl id="name-reg" isRequired> {/* Изменил id */}
              <FormLabel>Ім’я</FormLabel>
              <Input
                type="text" value={name} onChange={e => setName(e.target.value)}
                autoComplete="name"
                // Стилизация Input
                bg="whiteAlpha.100" borderColor="whiteAlpha.300" _hover={{ borderColor: "whiteAlpha.400" }} focusBorderColor="brand.gold" _placeholder={{ color: "gray.500" }}
              />
            </FormControl>

            <FormControl id="email-reg" isRequired> {/* Изменил id */}
              <FormLabel>Email</FormLabel>
              <Input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                 // Стилизация Input
                 bg="whiteAlpha.100" borderColor="whiteAlpha.300" _hover={{ borderColor: "whiteAlpha.400" }} focusBorderColor="brand.gold" _placeholder={{ color: "gray.500" }}
              />
            </FormControl>

            <FormControl id="password-reg" isRequired> {/* Изменил id */}
              <FormLabel>Пароль</FormLabel>
              <Input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                 // Стилизация Input
                 bg="whiteAlpha.100" borderColor="whiteAlpha.300" _hover={{ borderColor: "whiteAlpha.400" }} focusBorderColor="brand.gold" _placeholder={{ color: "gray.500" }}
              />
            </FormControl>

            <Button
              type="submit" w="100%" isLoading={loading} mt={4} size="lg" // Увеличили кнопку
              // Стилизация основной кнопки
              bg="brand.gold" color="brand.purple" _hover={{ bg: "brand.goldHover" }}
            >
              Зареєструватися
            </Button>

             {/* Ссылка на вход */}
             <Button as={RouterLink} to="/login" variant="link" colorScheme="gray" size="sm" mt={2}>
                Вже є акаунт? Увійти
            </Button>
          </VStack>
        </form>
      </Box>
    </Center>
  );
}