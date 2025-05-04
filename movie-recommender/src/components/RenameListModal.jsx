// src/components/RenameListModal.jsx (СТИЛИЗОВАННАЯ ВЕРСИЯ)
import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  useTheme, // Импорт useTheme
} from "@chakra-ui/react";
import axios from "axios";

export default function RenameListModal({
  isOpen,
  onClose,
  listToEdit,
  onListRenamed,
}) {
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const theme = useTheme(); // Получаем тему

  useEffect(() => {
    if (listToEdit) {
      setNewName(listToEdit.name);
    } else {
      setNewName("");
    }
  }, [listToEdit]);

  const handleSave = async () => {
    // ... (логика без изменений) ...
    if (!listToEdit) return;
    if (!newName.trim() || newName.trim() === listToEdit.name) {
      toast({
        title: "Введіть нову назву для списку.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsSaving(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axios.put(
        `/api/lists/${listToEdit.id}`,
        { name: newName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onListRenamed) {
        onListRenamed(response.data);
      }
      toast({
        title: `Список перейменовано на "${response.data.name}".`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (err) {
      const errorMsg =
        err.response?.data?.description ||
        err.response?.data?.message ||
        "Не вдалося перейменувати список.";
      toast({
        title: "Помилка перейменування",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Rename list error:", err.response?.data || err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSave();
    }
  };

  // Цвета из темы
  const modalBg = "brand.purple";
  const headerColor = "brand.gold";
  const bodyColor = "whiteAlpha.900";
  const inputBg = "whiteAlpha.100";
  const inputBorder = "whiteAlpha.300";
  const inputHoverBorder = "whiteAlpha.400";
  const focusBorder = "brand.gold";
  const borderColor = "whiteAlpha.200";
  const buttonTextColor = "brand.purple"; // Или 'gray.900'

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg={modalBg} color={bodyColor} borderRadius="xl">
        <ModalHeader
          color={headerColor}
          borderBottomWidth="1px"
          borderColor={borderColor}>
          Перейменувати список "{listToEdit?.name}"
        </ModalHeader>
        <ModalCloseButton
          _hover={{ bg: "whiteAlpha.200" }}
          top="14px"
          right="14px"
        />
        <ModalBody>
          <FormControl isRequired mt={2}>
            <FormLabel>Нова назва списку</FormLabel>
            <Input
              placeholder="Введіть нову назву"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
              // Стилизация Input
              bg={inputBg}
              borderColor={inputBorder}
              _hover={{ borderColor: inputHoverBorder }}
              focusBorderColor={focusBorder}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
          {/* Кнопка Отмена */}
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            isDisabled={isSaving}
            _hover={{ bg: "whiteAlpha.100" }}>
            Скасувати
          </Button>
          {/* Кнопка Сохранить */}
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Збереження..."
            // Стилизация основной кнопки
            bg="brand.gold"
            color={buttonTextColor}
            _hover={{ bg: "brand.goldHover" }}>
            Зберегти
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
