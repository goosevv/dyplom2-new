// src/pages/ContentManagerPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Spinner,
  useToast,
} from "@chakra-ui/react";

export default function ContentManagerPage() {
  const [movies, setMovies] = useState(null);
  const toast = useToast();

  useEffect(() => {
    axios
      .get("/api/movies", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setMovies(res.data))
      .catch(() =>
        toast({ status: "error", title: "Не вдалось завантажити фільми" })
      );
  }, []);

  if (movies === null) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading mb={4}>Панель контент-менеджера</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Назва</Th>
            <Th>Рік</Th>
            <Th>Жанри</Th>
            <Th>Дії</Th>
          </Tr>
        </Thead>
        <Tbody>
          {movies.map((m) => (
            <Tr key={m.movie_id}>
              <Td>{m.title_uk || m.title_en}</Td>
              <Td>{m.year}</Td>
              <Td>{m.genres}</Td>
              <Td>
                <Button
                  size="sm"
                  mr={2}
                  onClick={() =>
                    toast({ title: "Тут буде редагування фільму" })
                  }
                >
                  Редагувати
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  onClick={() =>
                    axios
                      .delete(`/api/movies/${m.movie_id}`, {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "token"
                          )}`,
                        },
                      })
                      .then(() => {
                        setMovies((lst) =>
                          lst.filter((x) => x.movie_id !== m.movie_id)
                        );
                        toast({ status: "success", title: "Фільм видалено" });
                      })
                      .catch(() =>
                        toast({
                          status: "error",
                          title: "Помилка видалення фільму",
                        })
                      )
                  }
                >
                  Видалити
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Button
        mt={4}
        colorScheme="green"
        onClick={() => toast({ title: "Тут буде форма додавання" })}
      >
        Додати новий фільм
      </Button>
    </Box>
  );
}
