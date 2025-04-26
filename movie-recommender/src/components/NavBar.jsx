// src/components/NavBar.jsx
import React from 'react'
import {
  Flex,
  Box,
  HStack,
  Link,
  Button
} from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'

export default function NavBar() {
  return (
    <Flex
      as="nav"
      position="absolute"
      top="0"
      left="0"
      w="100%"
      px={{ base: 6, md: 12 }}
      py={4}
      align="center"
      justify="space-between"
      bg="transparent"
      zIndex="banner"
    >
      {/* Левый логотип */}
      <Box>
        <Link
          as={NavLink}
          to="/"
          fontSize="2xl"
          fontWeight="bold"
          color="white"
          _hover={{ opacity: 0.8, textDecor: 'none' }}
        >
          MovieReco
        </Link>
      </Box>

      {/* Центр — навигационные ссылки */}
      <HStack spacing={{ base: 4, md: 8 }}>
        <Link
          as={NavLink}
          to="/"
          color="white"
          _hover={{ opacity: 0.8, textDecor: 'none' }}
          sx={{ '&.active': { borderBottom: '2px solid white' } }}
        >
          Головна
        </Link>
        <Link
          as={NavLink}
          to="/recommendations"
          color="white"
          _hover={{ opacity: 0.8, textDecor: 'none' }}
          sx={{ '&.active': { borderBottom: '2px solid white' } }}
        >
          Рекомендації
        </Link>
        <Link
          as={NavLink}
          to="/favorites"
          color="white"
          _hover={{ opacity: 0.8, textDecor: 'none' }}
          sx={{ '&.active': { borderBottom: '2px solid white' } }}
        >
          Улюблені
        </Link>
        <Link
          as={NavLink}
          to="/profile"
          color="white"
          _hover={{ opacity: 0.8, textDecor: 'none' }}
          sx={{ '&.active': { borderBottom: '2px solid white' } }}
        >
          Профіль
        </Link>
      </HStack>

      {/* Правый блок — кнопки входа/регистрации */}
      <HStack spacing={4}>
        <Link
          as={NavLink}
          to="/login"
          color="white"
          _hover={{ opacity: 0.8, textDecor: 'none' }}
        >
          Вхід
        </Link>
        <Button
          as={NavLink}
          to="/register"
          colorScheme="teal"
          bg="white"
          color="black"
          size="sm"
        >
          Реєстрація
        </Button>
      </HStack>
    </Flex>
  )
}
