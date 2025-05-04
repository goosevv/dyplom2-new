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
  useToast,
  useColorModeValue, // <<< Оставляем импорт
  Text,
  Flex,
  Link,
  Spacer,
  Center,
  useDisclosure, // <<< Добавить для модалки редактирования
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons"; // <<< Добавить EditIcon
import RenameListModal from "../components/RenameListModal"; // <<< Импорт модалки
import { Link as RouterLink } from "react-router-dom"; // <<< Добавить импорт

export default function MyListsPage() {
  // --- Начало блока хуков ---
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const toast = useToast();

  const {
    isOpen: isRenameModalOpen,
    onOpen: onRenameModalOpen,
    onClose: onRenameModalClose,
  } = useDisclosure();
  const [editingList, setEditingList] = useState(null); // Список, который редактируется
  const [renameValue, setRenameValue] = useState(""); // Значение в поле ввода модалки
  // Все useColorModeValue вызываем ЗДЕСЬ, наверху
  const bg = useColorModeValue("gray.100", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  // Добавляем переменные для цветов, которые использовались внутри JSX
  const emptyListTextColor = useColorModeValue("gray.600", "gray.400");
  const listItemBg = useColorModeValue("white", "gray.700");
  const listItemHoverBg = useColorModeValue("gray.50", "gray.600");
  // --- Конец блока хуков ---

  // Функция для загрузки списков
  const fetchLists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
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
      setLists([]);
      console.error("Fetch lists error:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Загружаем списки при монтировании
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Обработчик создания
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
      setLists((prevLists) => [response.data, ...prevLists]);
      setNewListName("");
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
      setError(errorMsg);
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

  // Обработчик удаления
  const handleDeleteList = async (listId, listName) => {
    if (
      !window.confirm(
        `Ви впевнені, що хочете видалити список "${listName}"? Це видалить усі фільми в ньому.`
      )
    ) {
      return;
    }
    setDeletingId(listId);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`/api/lists/${listId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      setDeletingId(null);
    }
  };

  // --- Обработчик открытия модалки редактирования ---
  const handleOpenRenameModal = (list) => {
    setEditingList(list); // Запоминаем список для редактирования
    setRenameValue(list.name); // Устанавливаем текущее имя в поле ввода (хотя модалка тоже это делает)
    onRenameModalOpen(); // Открываем модалку
  };

  // --- Обработчик после успешного переименования (вызывается из модалки) ---
  const handleListRenamed = (updatedList) => {
    // Обновляем имя списка в нашем общем состоянии lists
    setLists((prevLists) =>
      prevLists.map((list) => (list.id === updatedList.id ? updatedList : list))
    );
  };

  // --- Начало основного рендеринга ---
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

        {/* Форма создания */}
        <form onSubmit={handleCreateList}>
          <HStack mb={6}>
            <Input
              placeholder="Назва нового списку"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              isDisabled={isCreating}
            />
            <Button
              type="submit"
              colorScheme="teal"
              isLoading={isCreating}
              loadingText="Створення..."
              px={6}>
              Створити
            </Button>
          </HStack>
        </form>

        {/* Ошибка */}
        {error && !isLoading && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Списки */}
        <Heading as="h2" size="md" mb={4} mt={8}>
          Існуючі списки:
        </Heading>
        {isLoading ? (
          <Center py={10}>
            {" "}
            <Spinner />{" "}
          </Center>
        ) : lists.length === 0 ? (
          // Используем переменную emptyListTextColor
          <Text color={emptyListTextColor}>
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
                // Используем переменные listItemBg и listItemHoverBg
                bg={listItemBg}
                _hover={{ bg: listItemHoverBg }}>
                <Flex align="center">
                  <Link
                    as={RouterLink}
                    to={`/list/${list.id}`}
                    flexGrow={1}
                    mr={2}
                    _hover={{ textDecoration: "underline" }}>
                    <Text fontWeight="medium" flexGrow={1} mr={2}>
                      {" "}
                      {list.name}{" "}
                    </Text>
                  </Link>
                  <HStack spacing={1}>
                    {/* Кнопка редактирования */}
                    <IconButton
                      aria-label={`Редагувати список ${list.name}`}
                      icon={<EditIcon />} // <<< Иконка редактирования
                      size="sm"
                      colorScheme="yellow" // Или другой цвет
                      variant="ghost"
                      onClick={() => handleOpenRenameModal(list)} // <<< Открываем модалку
                      isDisabled={deletingId !== null} // Блокируем во время удаления другого списка
                    />
                    <IconButton
                      aria-label={`Видалити список ${list.name}`}
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDeleteList(list.id, list.name)}
                      isLoading={deletingId === list.id}
                      isDisabled={deletingId !== null}
                    />
                  </HStack>
                </Flex>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
      {/* Модальное окно для переименования */}
      {editingList && ( // Рендерим только если есть список для редактирования
        <RenameListModal
          isOpen={isRenameModalOpen}
          onClose={onRenameModalClose}
          listToEdit={editingList}
          onListRenamed={handleListRenamed} // Передаем колбэк для обновления состояния
        />
      )}
    </Box>
  );
}
