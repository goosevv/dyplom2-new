// src/pages/Home.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Container, Heading, Text, Button, VStack, useColorModeValue
} from '@chakra-ui/react'
import { FiPlayCircle } from 'react-icons/fi'

export default function Home() {
  const navigate = useNavigate()          // ← получаем функцию навигации
  const bg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)'
  )

  return (
    <Box bg={bg} color="white" py={{ base: 20, md: 32 }} textAlign="center">
      <Container maxW="container.lg">
        <VStack spacing={6}>
          <Heading fontSize={{ base: '3xl', md: '5xl' }} fontWeight="extrabold">
            Відкрий для себе ідеальні фільми
          </Heading>
          <Text fontSize={{ base: 'md', md: 'lg' }} maxW="3xl">
            Знайди рекомендації, оцінюй, зберігай улюблене – усе в одному місці.
          </Text>
          <Button
            size="lg"
            colorScheme="teal"
            rightIcon={<FiPlayCircle />}
            onClick={() => navigate('/recommendations')}  // ← навигация
          >
            Почати зараз
          </Button>
        </VStack>
      </Container>
    </Box>
  )
}
