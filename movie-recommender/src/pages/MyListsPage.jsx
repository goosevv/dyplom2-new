// src/pages/MyListsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box, Heading, VStack, HStack, Input, Button, List, ListItem, IconButton,
  Spinner, Alert, AlertIcon, useToast, Text, Flex, Link, Spacer, Center, Icon,
  useDisclosure, Tooltip
  // useColorModeValue убран
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon, LockIcon, UnlockIcon, LinkIcon } from "@chakra-ui/icons";
import RenameListModal from "../components/RenameListModal"; // Модалка стилизуется отдельно
import ShareListModal from "../components/ShareListModal";   // Модалка стилизуется отдельно
import { Link as RouterLink } from "react-router-dom";

export default function MyListsPage() {
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Состояния для модалок
  const { isOpen: isRenameModalOpen, onOpen: onRenameModalOpen, onClose: onRenameModalClose } = useDisclosure();
  const [editingList, setEditingList] = useState(null);
  const { isOpen: isShareModalOpen, onOpen: onShareModalOpen, onClose: onShareModalClose } = useDisclosure();
  const [sharingList, setSharingList] = useState(null);

  // Используем фиксированные цвета для темной темы
  // const bg = useColorModeValue("gray.100", "gray.800"); // Убран
  const cardBg = "whiteAlpha.100"; // Полупрозрачный фон для карточки/списка
  const listItemBg = "whiteAlpha.50"; // Чуть прозрачнее для элемента списка
  const listItemHoverBg = "whiteAlpha.200"; // Эффект при наведении

  // Загрузка списков
  const fetchLists = useCallback(async () => {
    // ... (логика fetchLists остается без изменений) ...
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

  useEffect(() => { fetchLists(); }, [fetchLists]);

  // Создание списка
  const handleCreateList = async (e) => {
    // ... (логика handleCreateList остается без изменений) ...
     e.preventDefault();
    if (!newListName.trim()) {
      toast({ title: "Назва списку не може бути порожньою.", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    setIsCreating(true);
    setError(null);
    const token = localStorage.getItem("token");
     try {
      const response = await axios.post( "/api/lists", { name: newListName.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setLists((prevLists) => [response.data, ...prevLists]);
      setNewListName("");
      toast({ title: `Список "${response.data.name}" створено.`, status: "success", duration: 3000, isClosable: true });
    } catch (err) {
      const errorMsg = err.response?.data?.description || err.response?.data?.message || "Не вдалося створити список.";
      setError(errorMsg);
      toast({ title: "Помилка створення списку", description: errorMsg, status: "error", duration: 5000, isClosable: true });
      console.error("Create list error:", err.response?.data || err);
    } finally {
      setIsCreating(false);
    }
  };

  // Удаление списка
  const handleDeleteList = async (listId, listName) => {
     // ... (логика handleDeleteList остается без изменений) ...
      if (!window.confirm(`Ви впевнені, що хочете видалити список "${listName}"? Це видалить усі фільми в ньому.`)) { return; }
    setDeletingId(listId);
    setError(null);
    const token = localStorage.getItem("token");
     try {
      await axios.delete(`/api/lists/${listId}`, { headers: { Authorization: `Bearer ${token}` } });
      setLists((prevLists) => prevLists.filter((list) => list.id !== listId));
      toast({ title: `Список "${listName}" видалено.`, status: "info", duration: 3000, isClosable: true });
    } catch (err) {
      const errorMsg = err.response?.data?.description || err.response?.data?.message || "Не вдалося видалити список.";
      setError(errorMsg);
      toast({ title: "Помилка видалення", description: errorMsg, status: "error", duration: 5000, isClosable: true });
      console.error("Delete list error:", err.response?.data || err);
    } finally {
      setDeletingId(null);
    }
  };

  // Открытие модалок
  const handleOpenRenameModal = (list) => { setEditingList(list); onRenameModalOpen(); };
  const handleListRenamed = (updatedList) => { setLists((prevLists) => prevLists.map((list) => (list.id === updatedList.id ? updatedList : list))); };
  const handleOpenShareModal = (list) => { setSharingList(list); onShareModalOpen(); };
  const handleListShareStatusChanged = (updatedList) => { setLists((prevLists) => prevLists.map((list) => list.id === updatedList.id ? { ...list, is_public: updatedList.is_public } : list)); };

  return (
    // Убираем bg
    <Box minH="calc(100vh - 70px)" py={10} px={4}>
      <Box maxW="xl" mx="auto" p={6} bg={cardBg} borderRadius="xl" boxShadow="md" borderWidth="1px" borderColor="whiteAlpha.200">
        <Heading as="h1" size="xl" mb={6} color="brand.gold" textAlign="center"> {/* Золотой заголовок */}
          Мої списки фільмів
        </Heading>

        {/* Форма создания */}
        <form onSubmit={handleCreateList}>
          <HStack mb={6}>
            <Input
              placeholder="Назва нового списку" value={newListName} onChange={(e) => setNewListName(e.target.value)}
              isDisabled={isCreating}
              // Стилизация Input
              bg="whiteAlpha.100" borderColor="whiteAlpha.300" _hover={{ borderColor: "whiteAlpha.400" }} focusBorderColor="brand.gold" _placeholder={{ color: "gray.500" }}
            />
            <Button
              type="submit" isLoading={isCreating} loadingText="Створення..." px={6}
              // Стилизация основной кнопки
              bg="brand.gold" color="brand.purple" _hover={{ bg: "brand.goldHover" }}
            >
              Створити
            </Button>
          </HStack>
        </form>

        {error && !isLoading && (
          <Alert status="error" mb={4} borderRadius="md" variant="subtle">
            <AlertIcon /> {error}
          </Alert>
        )}

        <Heading as="h2" size="lg" mb={4} mt={8} borderBottomWidth="1px" borderColor="brand.gold" pb={2}> {/* Золотой подзаголовок */}
          Існуючі списки:
        </Heading>
        {isLoading ? (
          <Center py={10}> <Spinner color="brand.gold"/> </Center>
        ) : lists.length === 0 ? (
          <Text color="gray.400"> У вас ще немає створених користувацьких списків. </Text>
        ) : (
          <List spacing={3}>
            {lists.map((list) => (
              <ListItem
                key={list.id} p={3} borderWidth="1px" borderRadius="md" bg={listItemBg} _hover={{ bg: listItemHoverBg }} borderColor="transparent" // Убираем рамку у элемента списка
              >
                <Flex align="center">
                  <Tooltip label={list.is_public ? "Публічний" : "Приватний"} placement="top" hasArrow>
                    <Icon as={list.is_public ? UnlockIcon : LockIcon} mr={3} color={list.is_public ? "green.400" : "gray.500"} />
                  </Tooltip>
                  <Link as={RouterLink} to={`/list/${list.id}`} flexGrow={1} mr={2} _hover={{ color: "brand.gold" }}> {/* Ссылка золотая при наведении */}
                    <Text fontWeight="medium"> {list.name} </Text>
                  </Link>
                  <HStack spacing={1}>
                    <Tooltip label="Поділитися" placement="top" hasArrow>
                      <IconButton
                        aria-label={`Поділитися списком ${list.name}`} icon={<LinkIcon />} size="sm" colorScheme="blue" variant="ghost"
                        onClick={() => handleOpenShareModal(list)} isDisabled={deletingId !== null}
                      />
                    </Tooltip>
                    <Tooltip label="Редагувати назву" placement="top" hasArrow>
                      <IconButton
                        aria-label={`Редагувати список ${list.name}`} icon={<EditIcon />} size="sm" colorScheme="yellow" variant="ghost"
                        onClick={() => handleOpenRenameModal(list)} isDisabled={deletingId !== null}
                      />
                    </Tooltip>
                     <Tooltip label="Видалити список" placement="top" hasArrow>
                      <IconButton
                        aria-label={`Видалити список ${list.name}`} icon={<DeleteIcon />} size="sm" colorScheme="red" variant="ghost"
                        onClick={() => handleDeleteList(list.id, list.name)} isLoading={deletingId === list.id} isDisabled={deletingId !== null}
                      />
                     </Tooltip>
                  </HStack>
                </Flex>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
      {/* Модальные окна */}
      {editingList && (<RenameListModal isOpen={isRenameModalOpen} onClose={onRenameModalClose} listToEdit={editingList} onListRenamed={handleListRenamed} /> )}
      {sharingList && (<ShareListModal isOpen={isShareModalOpen} onClose={onShareModalClose} listData={sharingList} onStatusChange={handleListShareStatusChanged} /> )}
    </Box>
  );
}