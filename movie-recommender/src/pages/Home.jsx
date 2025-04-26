// src/pages/Home.jsx
import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Flex,
  VStack,
  SimpleGrid,
  Icon,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiPlayCircle, FiMusic, FiUsers } from "react-icons/fi";

export default function Home() {
  const bg = useColorModeValue(
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #2D3748 0%, #1A202C 100%)"
  );
  const featureBg = useColorModeValue("whiteAlpha.800", "whiteAlpha.100");

  return (
    <Box>
      {/* HERO */}
      <Box bg={bg} color="white" py={{ base: 20, md: 32 }} textAlign="center">
        <Container maxW="container.lg">
          <VStack spacing={6}>
            <Heading
              as="h1"
              fontSize={{ base: "3xl", md: "5xl" }}
              fontWeight="extrabold">
              Відкрий для себе ідеальні фільми
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} maxW="3xl">
              Знайди рекомендації, оцінюй, зберігай улюблене – усе в одному
              місці.
            </Text>
            <Button
              size="lg"
              colorScheme="teal"
              rightIcon={<FiPlayCircle />}
              onClick={() => nav("/recommendations")}>
              Почати зараз
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* FEATURES */}
      <Box
        py={{ base: 16, md: 24 }}
        bg={useColorModeValue("gray.50", "gray.900")}>
        <Container maxW="container.lg">
          <Heading textAlign="center" mb={12}>
            Наші можливості
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            {[
              {
                icon: FiMusic,
                title: "Рекомендації на основі смаків",
                text: "Алгоритми SVD, KNN та гібриди допоможуть знайти саме те, що сподобається.",
              },
              {
                icon: FiUsers,
                title: "Спільнота користувачів",
                text: "Дивись, що обирають інші, та додавай до улюбленого.",
              },
              {
                icon: FiPlayCircle,
                title: "Швидкий пошук",
                text: "Миттєво знаходь фільми за назвою, жанром чи актором.",
              },
            ].map((f, i) => (
              <Stack
                key={i}
                p={6}
                bg={featureBg}
                borderRadius="lg"
                align="center"
                textAlign="center"
                boxShadow="md"
                transition="transform .2s"
                _hover={{ transform: "scale(1.05)" }}>
                <Icon as={f.icon} boxSize={12} mb={4} color="teal.400" />
                <Heading as="h3" size="md">
                  {f.title}
                </Heading>
                <Text color="gray.600">{f.text}</Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  );
}
