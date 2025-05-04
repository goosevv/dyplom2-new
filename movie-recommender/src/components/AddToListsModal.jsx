// src/components/AddToListsModal.jsx (СТИЛИЗОВАННАЯ ВЕРСИЯ)
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
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
  Flex,
  Spacer,
  Center,
  useTheme, // Импорт useTheme
  // useColorModeValue убран
} from "@chakra-ui/react";

export default function AddToListsModal({
  isOpen,
  onClose,
  movieId,
  movieTitle,
}) {
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToListId, setAddingToListId] = useState(null);
  const [error, setError] = useState(null);
  const toast = useToast();
  const theme = useTheme(); // Получаем тему

  // Цвета из темы
  const modalBg = "brand.purple";
  const headerColor = "brand.gold";
  const bodyColor = "whiteAlpha.900";
  const listItemBg = "transparent";
  const listItemHoverBg = "whiteAlpha.100";
  const borderColor = "whiteAlpha.200";
  const buttonTextColor = "brand.gold";

  const fetchLists = useCallback(async () => {
    // ... (логика без изменений) ...
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Помилка аутентифікації.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.get("/api/lists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLists(response.data);
    } catch (err) {
      setError("Не вдалося завантажити ваші списки.");
      console.error("Fetch lists for modal error:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleAddToList = async (listId, listName) => {
    // ... (логика без изменений) ...
    setAddingToListId(listId);
    setError(null);
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `/api/lists/${listId}/movies`,
        { movieId: movieId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: `Фільм "${movieTitle}" додано до списку "${listName}".`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // onClose(); // Можно закрывать после добавления
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.description ||
        "Не вдалося додати фільм до списку.";
      toast({
        title: "Помилка додавання",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Add to list error:", err.response?.data || err);
    } finally {
      setAddingToListId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      scrollBehavior="inside"
      size="lg"
      isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg={modalBg} color={bodyColor} borderRadius="xl">
        <ModalHeader
          color={headerColor}
          borderBottomWidth="1px"
          borderColor={borderColor}>
          Додати "{movieTitle}" до списку
        </ModalHeader>
        <ModalCloseButton
          _hover={{ bg: "whiteAlpha.200" }}
          top="14px"
          right="14px"
        />
        <ModalBody>
          {error && (
            <Alert status="error" mb={4} borderRadius="md" variant="subtle">
              {" "}
              <AlertIcon /> {error}{" "}
            </Alert>
          )}

          {isLoading ? (
            <Center py={5}>
              {" "}
              <Spinner color="brand.gold" />{" "}
            </Center>
          ) : lists.length === 0 ? (
            <Text color="gray.400">
              {" "}
              У вас немає створених списків. Створіть новий на сторінці "Мої
              списки".{" "}
            </Text>
          ) : (
            <List spacing={2}>
              {lists.map((list) => (
                <ListItem
                  key={list.id}
                  p={2}
                  borderRadius="md"
                  _hover={{ bg: listItemHoverBg }}>
                  <Flex align="center">
                    <Text>{list.name}</Text>
                    <Spacer />
                    {/* Стилизуем кнопку "Додати" */}
                    <Button
                      size="sm"
                      variant="outline" // Контурная кнопка
                      borderColor={buttonTextColor} // Золотая рамка
                      color={buttonTextColor} // Золотой текст
                      _hover={{ bg: "whiteAlpha.100" }} // Легкий фон при наведении
                      onClick={() => handleAddToList(list.id, list.name)}
                      isLoading={addingToListId === list.id}
                      isDisabled={addingToListId !== null}>
                      Додати
                    </Button>
                  </Flex>
                </ListItem>
              ))}
            </List>
          )}
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
          {/* Стилизуем кнопку Закрыть */}
          <Button
            variant="ghost"
            onClick={onClose}
            _hover={{ bg: "whiteAlpha.100" }}>
            Закрити
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
