// src/App.jsx (или где лежит ваш NavBar)
import React from 'react'
import { Routes, Route, Link as ChakraLink } from 'react-router-dom'
import {
  Box,
  Flex,
  Heading,
  Spacer,
  HStack,
  Container,
  useColorModeValue
} from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'  // ← импортируем из react-router

import Home            from './pages/Home'
import Recommendations from './pages/Recommendations'
import Favorites       from './pages/Favorites'
import Profile         from './pages/Profile'
import Login           from './pages/Login'
import Register        from './pages/Register'

function NavBar() {
  // прозрачный фон, либо полупрозрачный тёмный
  const bg = useColorModeValue('rgba(255,255,255,0.8)', 'rgba(0,0,0,0.6)')

  return (
    <Flex
      as="nav"
      // делаем шапку fixed, чтобы весь контент скользил под ней
      position="fixed"
      top="0"
      w="100%"
      bg={bg}
      // добавим небольшую тень, чтобы шапка отделялась от контента
      boxShadow="sm"
      zIndex="banner"
      align="center"
      py={4}
      px={{ base: 4, md: 8 }}
    >
      <Container maxW="container.xl" display="flex" alignItems="center">
        <Heading size="md">
          <ChakraLink as={NavLink} to="/" _hover={{ textDecor: 'none' }}>
            MovieReco
          </ChakraLink>
        </Heading>
        <Spacer />
        <HStack spacing={6}>
          {[
            ['/',            'Головна'],
            ['/recommendations','Рекомендації'],
            ['/favorites',   'Улюблені'],
            ['/profile',     'Профіль'],
            ['/login',       'Вхід'],
            ['/register',    'Реєстрація'],
          ].map(([to, label]) => (
            <ChakraLink
              as={NavLink}
              key={to}
              to={to}
              _hover={{ textDecoration: 'none' }}
              sx={{
                // стили для активной ссылки
                '&.active': {
                  color: 'teal.300',
                  fontWeight: 'bold',
                  borderBottom: '2px solid',
                  borderColor: 'teal.300',
                }
              }}
            >
              {label}
            </ChakraLink>
          ))}
        </HStack>
      </Container>
    </Flex>
  )
}

export default function App() {
  return (
    <>
      <NavBar />
      {/* во весь экран, отступ сверху на высоту шапки */}
      <Box pt="80px">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/favorites"       element={<Favorites />} />
          <Route path="/profile"         element={<Profile />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
        </Routes>
      </Box>
    </>
  )
}

