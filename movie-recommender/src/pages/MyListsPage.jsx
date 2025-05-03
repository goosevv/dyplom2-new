// src/pages/MyListsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  VStack,
  HStack,
  Input,
  Button,
  List,
  ListItem,
  IconButton,
  Spinner,
  Alert,
  AlertIcon,
  useToast, // Для уведомлений
  useColorModeValue,
  Text,
  Flex, // Для размещения элементов в строке
  Spacer, // Для расталкивания элементов
  Center, // Для центрирования спиннера
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons"; // Иконка для удаления

export default function MyListsPage() {
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false); // Состояние для загрузки создания
  const [deletingId, setDeletingId] = useState(null); // ID списка, который удаляется
  const [error, setError] = useState(null);
  const toast = useToast(); // Хук для всплывающих уведомлений
  const bg = useColorModeValue("gray.100", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");

  // Функция для загрузки списков
  const fetchLists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      // Эта проверка избыточна из-за ProtectedRoute, но оставим на всякий случай
      setError("Помилка аутентифікації.");
      setIsLoading(false);
      setLists([]);
      return;
    }
    try {
      const response = await axios.get("/api/lists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLists(response.data);
    } catch (err) {
      setError("Не вдалося завантажити списки.");
      setLists([]); // Устанавливаем пустой массив при ошибке
      console.error("Fetch lists error:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  }, []); // Пустой массив зависимостей, т.к. токен берется из localStorage

  // Загружаем списки при монтировании компонента
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Обработчик создания нового списка
  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) {
      toast({
        title: "Назва списку не може бути порожньою.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsCreating(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "/api/lists",
        { name: newListName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Добавляем новый список в начало массива в состоянии
      setLists((prevLists) => [response.data, ...prevLists]);
      setNewListName(""); // Очищаем поле ввода
      toast({
        title: `Список "${response.data.name}" створено.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.description ||
        err.response?.data?.message ||
        "Не вдалося створити список.";
      setError(errorMsg); // Отображаем ошибку на странице
      toast({
        title: "Помилка створення списку",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Create list error:", err.response?.data || err);
    } finally {
      setIsCreating(false);
    }
  };

  // Обработчик удаления списка
  const handleDeleteList = async (listId, listName) => {
    // Можно добавить окно подтверждения
    if (
      !window.confirm(
        `Ви впевнені, що хочете видалити список "${listName}"? Це видалить усі фільми в ньому.`
      )
    ) {
      return;
    }

    setDeletingId(listId); // Устанавливаем ID удаляемого списка для индикации загрузки
    setError(null);
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`/api/lists/${listId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Удаляем список из состояния после успешного ответа сервера
      setLists((prevLists) => prevLists.filter((list) => list.id !== listId));
      toast({
        title: `Список "${listName}" видалено.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.description ||
        err.response?.data?.message ||
        "Не вдалося видалити список.";
      setError(errorMsg);
      toast({
        title: "Помилка видалення",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Delete list error:", err.response?.data || err);
    } finally {
      setDeletingId(null); // Сбрасываем ID удаляемого списка
    }
  };

  return (
    <Box bg={bg} minH="calc(100vh - 70px)" py={10} px={4}>
      <Box
        maxW="xl"
        mx="auto"
        p={6}
        bg={cardBg}
        borderRadius="lg"
        boxShadow="md">
        <Heading as="h1" size="lg" mb={6}>
          Мої списки фільмів
        </Heading>

        {/* Форма создания нового списка */}
        <form onSubmit={handleCreateList}>
          <HStack mb={6}>
            <Input
              placeholder="Назва нового списку"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              isDisabled={isCreating} // Блокируем поле во время создания
            />
            <Button
              type="submit"
              colorScheme="teal"
              isLoading={isCreating} // Показываем спиннер на кнопке
              loadingText="Створення..." // Текст во время загрузки
              px={6}>
              Створити
            </Button>
          </HStack>
        </form>

        {/* Отображение общей ошибки загрузки */}
        {error &&
          !isLoading && ( // Показываем только если не идет общая загрузка
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

        {/* Отображение списков */}
        <Heading as="h2" size="md" mb={4} mt={8}>
          Існуючі списки:
        </Heading>
        {isLoading ? (
          <Center py={10}>
            <Spinner />
          </Center>
        ) : lists.length === 0 ? (
          <Text color={useColorModeValue("gray.600", "gray.400")}>
            У вас ще немає створених користувацьких списків.
          </Text>
        ) : (
          <List spacing={3}>
            {lists.map((list) => (
              <ListItem
                key={list.id}
                p={3}
                borderWidth="1px"
                borderRadius="md"
                bg={useColorModeValue("white", "gray.700")} // Фон элемента списка
                _hover={{ bg: useColorModeValue("gray.50", "gray.600") }}>
                <Flex align="center">
                  {/* TODO: Сделать имя ссылкой на /list/{list.id} */}
                  <Text fontWeight="medium" flexGrow={1} mr={2}>
                    {list.name}
                  </Text>
                  {/* <Spacer /> */}{" "}
                  {/* Spacer может быть не нужен, если имя растягивается */}
                  <IconButton
                    aria-label={`Видалити список ${list.name}`}
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleDeleteList(list.id, list.name)}
                    isLoading={deletingId === list.id} // Показываем спиннер на конкретной кнопке
                    isDisabled={deletingId !== null} // Блокируем другие кнопки удаления во время процесса
                  />
                </Flex>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
