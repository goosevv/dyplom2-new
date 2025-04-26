// src/pages/Login.jsx
import React, { useState } from 'react'
import axios from 'axios'
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  VStack
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { API_ROOT } from '../config'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const { data } = await axios.post(`${API_ROOT}/login`, { email, password })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/profile')
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка входу')
    }
  }

  return (
    <Box maxW="sm" mx="auto" mt={12} p={6} borderWidth="1px" borderRadius="md">
      <Heading mb={6} textAlign="center">Вхід</Heading>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl id="email" isRequired>
            <FormLabel>Електронна пошта</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </FormControl>

          <FormControl id="password" isRequired>
            <FormLabel>Пароль</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </FormControl>

          <Button colorScheme="teal" type="submit" w="full">
            Увійти
          </Button>
        </VStack>
      </form>
    </Box>
  )
}
