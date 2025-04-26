// src/App.jsx
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'

import NavBar          from './components/NavBar'
import Home            from './pages/Home'
import Recommendations from './pages/Recommendations'
import Favorites       from './pages/Favorites'
import Profile         from './pages/Profile'
import Login           from './pages/Login'
import Register        from './pages/Register'

export default function App() {
  return (
    <>
      <NavBar />
      {/* Отступ сверху равен высоте прозрачной шапки */}
      <Box pt={{ base: '80px', md: '100px' }}>
        <Routes>
          <Route path="/"               element={<Home />} />
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
