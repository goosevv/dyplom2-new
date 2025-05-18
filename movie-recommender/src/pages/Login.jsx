// src/pages/Login.jsx
// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  Heading,
  Center,
} from "@chakra-ui/react";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom";
// <-- правильний шлях:
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/auth/login", { email, password });
      console.log("✅ Login success:", res.status, res.data);
      login(res.data.access_token, res.data.user);
      navigate("/recommendations");
    } catch (err) {
      console.error("⚠️ Full axios error:", err);
      console.error("– err.message:", err.message);
      console.error("– err.request:", err.request);
      console.error("– err.response:", err.response);
      setError(err.message || "Помилка входу — див. консоль.");
    }
  };

  return (
    <Center minH="calc(100vh - 70px)" px={4}>
      <Box
        maxW="md"
        w="100%"
        p={8}
        bg="whiteAlpha.100"
        borderRadius="xl"
        boxShadow="lg">
        <Heading size="xl" textAlign="center" mb={8} color="brand.gold">
          Вхід
        </Heading>
        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <VStack spacing={5} align="stretch">
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Пароль</FormLabel>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
              />
            </FormControl>
            <Button
              type="submit"
              isLoading={loading}
              bg="brand.gold"
              _hover={{ bg: "brand.goldHover" }}>
              Увійти
            </Button>
            <Button as={RouterLink} to="/register" variant="link" size="sm">
              Немає акаунту? Зареєструватися
            </Button>
          </VStack>
        </form>
      </Box>
    </Center>
  );
}
