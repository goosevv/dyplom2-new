// src/pages/Home.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  useColorModeValue
} from '@chakra-ui/react'
import { FiPlayCircle } from 'react-icons/fi'

export default function Home() {
  const navigate = useNavigate()
  // если хотите градиент вместо картинки, замените строку ниже на:
  // const bgImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  // const bgImage = 'url(/images/your-background.jpg)'  // ← путь к вашей картинке
 const bgImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  return (
    <Box
      pos="relative"
      height="100vh"
      backgroundImage={bgImage}
      backgroundSize="cover"
      backgroundPosition="center"
      _before={{
        // тёмный полупрозрачный оверлей
        content: '""',
        pos: 'absolute',
        inset: 0,
        bg: 'rgba(0,0,0,0.6)',
      }}
    >
      {/* Flex поверх оверлея, чтобы центрировать контент */}
      <Flex
        pos="relative"
        height="100%"
        align="center"
        justify="center"
        px={4}
      >
        <VStack spacing={6} textAlign="center" maxW="lg">
          <Heading
            as="h1"
            color="white"
            fontSize={{ base: '3xl', md: '5xl' }}
            fontWeight="extrabold"
            zIndex={1}
          >
            Відкрий для себе ідеальні фільми
          </Heading>
          <Text
            color="gray.200"
            fontSize={{ base: 'md', md: 'lg' }}
            maxW="md"
            zIndex={1}
          >
            Знайди рекомендації, оцінюй, зберігай улюблене – усе в одному місці.
          </Text>
          <Button
            size="lg"
            colorScheme="teal"
            rightIcon={<FiPlayCircle />}
            onClick={() => navigate('/recommendations')}
            zIndex={1}
          >
            Почати зараз
          </Button>
        </VStack>
      </Flex>
    </Box>
  )
}
