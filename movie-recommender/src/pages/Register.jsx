// src/pages/Register.jsx
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

export default function Register() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(null)
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await axios.post(`${API_ROOT}/register`, { name, email, password })
      setSuccess('Реєстрація успішна! Тепер можете зайти.')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка реєстрації')
    }
  }

  return (
    <Box maxW="sm" mx="auto" mt={12} p={6} borderWidth="1px" borderRadius="md">
      <Heading mb={6} textAlign="center">Реєстрація</Heading>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      {success && (
        <Alert status="success" mb={4}>
          <AlertIcon />
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl id="name" isRequired>
            <FormLabel>Ім’я</FormLabel>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </FormControl>

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
            Зареєструватися
          </Button>
        </VStack>
      </form>
    </Box>
  )
}
