// src/components/ShareListModal.jsx
import React, { useState, useEffect } from 'react';
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
  Text,
  VStack,
  HStack,
  Switch, // Используем Switch для переключения статуса
  FormControl,
  FormLabel,
  Input,
  IconButton,
  Tooltip,
  useClipboard, // Хук для копирования в буфер
  useToast,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';

export default function ShareListModal({ isOpen, onClose, listData, onStatusChange }) {
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Ссылка для шаринга (формируется на клиенте)
  // Используем listData?.id на случай, если listData еще не загружен
  const shareableLink = `${window.location.origin}/public/list/${listData?.id}`;
  const { hasCopied, onCopy } = useClipboard(shareableLink); // Хук для копирования

  // Обновляем локальное состояние isPublic при изменении listData
  useEffect(() => {
    if (listData) {
      setIsPublic(listData.is_public);
    }
  }, [listData]);

  // Обработчик переключения статуса
  const handleTogglePublic = async () => {
    if (!listData) return;
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      // Отправляем PUT запрос для переключения статуса
      const response = await axios.put(`/api/lists/${listData.id}/share`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newStatus = response.data.is_public;
      setIsPublic(newStatus); // Обновляем локальное состояние

      // Вызываем колбэк для обновления состояния на родительской странице
      if (onStatusChange) {
        onStatusChange(response.data); // Передаем все обновленные данные списка
      }

      toast({
        title: `Статус списку змінено на "${newStatus ? 'Публічний' : 'Приватний'}".`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const errorMsg = err.response?.data?.description || err.response?.data?.message || "Не вдалося змінити статус списку.";
      setError(errorMsg);
      toast({ title: "Помилка зміни статусу", description: errorMsg, status: "error", duration: 5000, isClosable: true });
      console.error("Toggle share status error:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Налаштування доступу "{listData?.name}"</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {error && (
            <Alert status="error" mb={4} borderRadius="md"> <AlertIcon /> {error} </Alert>
          )}

          <VStack spacing={4}>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor={`public-switch-${listData?.id}`} mb="0">
                Публічний доступ (доступ за посиланням):
              </FormLabel>
              <Switch
                id={`public-switch-${listData?.id}`}
                isChecked={isPublic}
                onChange={handleTogglePublic}
                isDisabled={isLoading}
                colorScheme="teal"
              />
               {isLoading && <Spinner size="sm" ml={2} />}
            </FormControl>

            {/* Показываем ссылку и кнопку копирования, если список публичный */}
            {isPublic && (
              <FormControl mt={4}>
                <FormLabel>Посилання для поширення:</FormLabel>
                <HStack>
                  <Input value={shareableLink} isReadOnly />
                  <Tooltip label={hasCopied ? "Скопійовано!" : "Копіювати"} closeOnClick={false}>
                    <IconButton
                      aria-label="Copy link"
                      icon={<CopyIcon />}
                      onClick={onCopy}
                    />
                  </Tooltip>
                </HStack>
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose} isDisabled={isLoading}>Закрити</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}