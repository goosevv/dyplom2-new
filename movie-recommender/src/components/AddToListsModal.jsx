// src/components/AddToListsModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  List,
  ListItem,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Flex, // Используем Flex для строки
  Spacer, // Для расталкивания элементов
  useColorModeValue,
  Center
} from '@chakra-ui/react';

export default function AddToListsModal({ isOpen, onClose, movieId, movieTitle }) {
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToListId, setAddingToListId] = useState(null); // ID списка, в который добавляем
  const [error, setError] = useState(null);
  const toast = useToast();
  const listItemHoverBg = useColorModeValue("gray.100", "gray.600");

  // Функция загрузки списков
  const fetchLists = useCallback(async () => {
    if (!isOpen) return; // Не загружаем, если модалка закрыта
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Помилка аутентифікації.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.get('/api/lists', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLists(response.data);
    } catch (err) {
      setError("Не вдалося завантажити ваші списки.");
      console.error("Fetch lists for modal error:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]); // Перезагружаем при открытии модального окна

  // Загружаем списки при открытии модального окна
  useEffect(() => {
    fetchLists();
  }, [fetchLists]); // Зависимость только от fetchLists (который зависит от isOpen)


  // Обработчик добавления фильма в список
  const handleAddToList = async (listId, listName) => {
    setAddingToListId(listId); // Показываем индикатор на кнопке
    setError(null); // Сбрасываем общую ошибку
    const token = localStorage.getItem('token');

    try {
      await axios.post(`/api/lists/${listId}/movies`,
        { movieId: movieId }, // Передаем movieId в теле запроса
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: `Фільм "${movieTitle}" додано до списку "${listName}".`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // Можно закрыть модалку после успешного добавления
      // onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.description || "Не вдалося додати фільм до списку.";
      toast({
        title: "Помилка додавання",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Add to list error:", err.response?.data || err);
       // setError(errorMsg); // Можно отобразить ошибку и в модалке
    } finally {
      setAddingToListId(null); // Убираем индикатор с кнопки
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside" size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Додати "{movieTitle}" до списку</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon /> {error}
            </Alert>
          )}

          {isLoading ? (
            <Center py={5}> <Spinner /> </Center>
          ) : lists.length === 0 ? (
            <Text>У вас немає створених списків. Створіть новий на сторінці "Мої списки".</Text>
          ) : (
            <List spacing={2}>
              {lists.map((list) => (
                <ListItem
                  key={list.id}
                  p={2}
                  borderRadius="md"
                  _hover={{ bg: listItemHoverBg }}
                >
                  <Flex align="center">
                    <Text>{list.name}</Text>
                    <Spacer />
                    <Button
                      size="sm"
                      colorScheme="teal"
                      variant="outline"
                      onClick={() => handleAddToList(list.id, list.name)}
                      isLoading={addingToListId === list.id}
                      isDisabled={addingToListId !== null} // Блокируем другие кнопки
                    >
                      Додати
                    </Button>
                  </Flex>
                </ListItem>
              ))}
            </List>
          )}
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Закрити</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}