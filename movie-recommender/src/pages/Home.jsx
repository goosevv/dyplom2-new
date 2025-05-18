// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Text, Button, VStack } from '@chakra-ui/react';
// import { FiPlayCircle } from 'react-icons/fi'; // Можно убрать иконку, если не нужна

export default function Home() {
  const navigate = useNavigate();

  // Оставляем градиентный фон для главной, но можно заменить на brand.purple, если хотите
  // const bgGradient = 'linear-gradient(135deg, #503470 0%, #30283C 100%)'; // Пример градиента на основе brand.purple
  const bgGradient = 'linear-gradient(135deg, #4a405a 0%, #30283C 100%)'; // Еще вариант

  return (
    <Box
      pos="relative"
      height="calc(100vh - 70px)" // Высота за вычетом хедера
      width="100%"
      overflow="hidden" // Предотвратить выход контента за градиент
    >
      {/* Flex для центрирования контента */}
      <Flex
        height="100%"
        align="center"
        justify="center"
        px={4}
        // Применяем градиент ко Flex контейнеру
        bgGradient={bgGradient}
        color="white" // Текст будет белым
      >
        <VStack spacing={6} textAlign="center" maxW="lg" zIndex={1}>
          <Heading
            as="h1"
            // color="white" // Унаследует от Flex
            fontSize={{ base: '3xl', md: '5xl' }}
            fontWeight="extrabold"
          >
            Відкрий для себе ідеальні фільми
          </Heading>
          <Text
            color="whiteAlpha.800" // Чуть менее яркий текст
            fontSize={{ base: 'md', md: 'lg' }}
            maxW="md"
          >
            Знайди рекомендації, оцінюй, зберігай улюблене – усе в одному місці.
          </Text>
          <Button
            size="lg"
            // Убираем colorScheme="teal"
            // rightIcon={<FiPlayCircle />} // Убираем иконку для чистоты
            onClick={() => navigate('/login')} // Или на /register ?
            // Стилизуем кнопку
            bg="brand.gold"
            color="brand.purple" // или 'gray.900'
            _hover={{ bg: "brand.goldHover" }}
            px={8} // Горизонтальный паддинг
          >
            Почати зараз
          </Button>
        </VStack>
      </Flex>
    </Box>
  );
}