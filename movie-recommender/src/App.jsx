// src/App.jsx
import React from 'react'
import { Routes, Route, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Flex,
  Heading,
  Spacer,
  HStack,
  Link,
  Container
} from '@chakra-ui/react'

import Recommendations from './pages/Recommendations'
import Favorites       from './pages/Favorites'
import Profile         from './pages/Profile'
import Login           from './pages/Login'
import Register        from './pages/Register'

function NavBar() {
  return (
    <Flex as="nav" bg="blue.600" color="white" p={4} align="center">
      <Heading size="md">
        <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
          MovieReco
        </Link>
      </Heading>
      <Spacer />
      <HStack spacing={6}>
        <Link as={RouterLink} to="/recommendations">Рекомендації</Link>
        <Link as={RouterLink} to="/favorites">Улюблені</Link>
        <Link as={RouterLink} to="/profile">Профіль</Link>
        <Link as={RouterLink} to="/login">Вхід</Link>
        <Link as={RouterLink} to="/register">Реєстрація</Link>
      </HStack>
    </Flex>
  )
}

export default function App() {
  return (
    <>
      <NavBar />
      {/* основной контейнер под страницы */}
      <Container maxW="container.xl" py={6}>
        <Routes>
          <Route path="/" element={<Recommendations />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/favorites"       element={<Favorites />} />
          <Route path="/profile"         element={<Profile />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
        </Routes>
      </Container>
    </>
  )
}
