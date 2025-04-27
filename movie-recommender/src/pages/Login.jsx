import React, { useState } from 'react';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  useColorModeValue
} from '@chakra-ui/react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const bg = useColorModeValue('white', 'gray.700');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/auth/login', { email, password });
      localStorage.setItem('access_token', res.data.access_token);
      navigate('/recommendations');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Помилка входу — перевірте логін/пароль.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      maxW="md"
      mx="auto"
      mt={12}
      p={6}
      bg={bg}
      borderRadius="md"
      boxShadow="lg"
    >
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon /> {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl id="email" isRequired>
            <FormLabel>Email</FormLabel>
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

          <Button
            type="submit"
            colorScheme="blue"
            w="100%"      
            isLoading={loading}
          >
            Вхід
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
