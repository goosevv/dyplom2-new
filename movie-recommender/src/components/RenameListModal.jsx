// src/components/RenameListModal.jsx
import React, { useState, useEffect } from 'react';
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
  useToast
} from '@chakra-ui/react';
import axios from 'axios';

export default function RenameListModal({ isOpen, onClose, listToEdit, onListRenamed }) {
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // Обновляем поле ввода, когда открывается модалка для нового списка
  useEffect(() => {
    if (listToEdit) {
      setNewName(listToEdit.name);
    } else {
      setNewName(''); // Сбрасываем, если listToEdit null
    }
  }, [listToEdit]);

  const handleSave = async () => {
    if (!listToEdit) return; // Нет списка для редактирования
    if (!newName.trim() || newName.trim() === listToEdit.name) {
      toast({ title: "Введіть нову назву для списку.", status: "warning", duration: 3000, isClosable: true });
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.put(`/api/lists/${listToEdit.id}`,
        { name: newName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Вызываем колбэк для обновления списка на основной странице
      if (onListRenamed) {
        onListRenamed(response.data); // Передаем обновленные данные списка
      }

      toast({ title: `Список перейменовано на "${response.data.name}".`, status: "success", duration: 3000, isClosable: true });
      onClose(); // Закрываем модалку

    } catch (err) {
       const errorMsg = err.response?.data?.description || err.response?.data?.message || "Не вдалося перейменувати список.";
       toast({ title: "Помилка перейменування", description: errorMsg, status: "error", duration: 5000, isClosable: true });
       console.error("Rename list error:", err.response?.data || err);
    } finally {
       setIsSaving(false);
    }
  };

  // Обработчик нажатия Enter в поле ввода
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSave();
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Перейменувати список "{listToEdit?.name}"</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>Нова назва списку</FormLabel>
            <Input
              placeholder="Введіть нову назву"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={handleKeyPress} // Добавляем обработчик Enter
              autoFocus // Фокус на поле при открытии
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSaving}>
            Скасувати
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Збереження..."
          >
            Зберегти
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}