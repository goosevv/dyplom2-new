// src/components/ShareListModal.jsx (СТИЛИЗОВАННАЯ ВЕРСИЯ)
import React, { useState, useEffect, useCallback } from "react"; // Добавлен useCallback
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
  VStack,
  HStack,
  Switch,
  FormControl,
  FormLabel,
  Input,
  IconButton,
  Tooltip,
  useClipboard,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  useTheme, // Импорт useTheme
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";

export default function ShareListModal({
  isOpen,
  onClose,
  listData,
  onStatusChange,
}) {
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  const theme = useTheme(); // Получаем тему

  const shareableLink = `${window.location.origin}/public/list/${listData?.id}`;
  const { hasCopied, onCopy } = useClipboard(shareableLink);

  useEffect(() => {
    if (listData) {
      setIsPublic(listData.is_public);
    }
  }, [listData]);

  // Оборачиваем в useCallback, если передаем в зависимости useEffect где-то еще
  const handleTogglePublic = useCallback(async () => {
    if (!listData) return;
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    try {
      const response = await axios.put(
        `/api/lists/${listData.id}/share`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newStatus = response.data.is_public;
      setIsPublic(newStatus);
      if (onStatusChange) {
        onStatusChange(response.data);
      }
      toast({
        title: `Статус списку змінено на "${
          newStatus ? "Публічний" : "Приватний"
        }".`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.description ||
        err.response?.data?.message ||
        "Не вдалося змінити статус списку.";
      setError(errorMsg);
      toast({
        title: "Помилка зміни статусу",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Toggle share status error:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  }, [listData, onStatusChange, toast]); // Добавляем зависимости

  // Цвета из темы
  const modalBg = "brand.purple";
  const headerColor = "brand.gold";
  const bodyColor = "whiteAlpha.900";
  const inputBg = "whiteAlpha.100";
  const inputBorder = "whiteAlpha.300";
  const inputHoverBorder = "whiteAlpha.400";
  const focusBorder = "brand.gold";
  const borderColor = "whiteAlpha.200"; // Цвет рамок
  const accentColor = theme.colors.brand.gold;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg={modalBg} color={bodyColor} borderRadius="xl">
        <ModalHeader
          color={headerColor}
          borderBottomWidth="1px"
          borderColor={borderColor}>
          Налаштування доступу "{listData?.name}"
        </ModalHeader>
        <ModalCloseButton
          _hover={{ bg: "whiteAlpha.200" }}
          top="14px"
          right="14px"
        />
        <ModalBody pb={6}>
          {error && (
            <Alert status="error" mb={4} borderRadius="md" variant="subtle">
              {" "}
              <AlertIcon /> {error}{" "}
            </Alert>
          )}

          <VStack spacing={5}>
            <FormControl
              display="flex"
              alignItems="center"
              justifyContent="space-between">
              <FormLabel
                htmlFor={`public-switch-${listData?.id}`}
                mb="0"
                mr={2}>
                {" "}
                {/* Добавили отступ справа */}
                Публічний доступ:
              </FormLabel>
              <HStack>
                {isLoading && <Spinner size="sm" color="brand.gold" />}
                <Switch
                  id={`public-switch-${listData?.id}`}
                  isChecked={isPublic}
                  onChange={handleTogglePublic}
                  isDisabled={isLoading}
                  colorScheme="yellow" // Используем желтый/золотой для Switch
                />
              </HStack>
            </FormControl>

            {isPublic && (
              <FormControl mt={4}>
                <FormLabel fontSize="sm">Посилання для поширення:</FormLabel>
                <HStack>
                  <Input
                    value={shareableLink}
                    isReadOnly
                    size="sm"
                    bg={inputBg}
                    borderColor={inputBorder}
                    focusBorderColor={focusBorder} // Стили инпута
                    _hover={{ borderColor: inputHoverBorder }}
                  />
                  <Tooltip
                    label={hasCopied ? "Скопійовано!" : "Копіювати"}
                    closeOnClick={false}
                    hasArrow>
                    {/* Стилизуем кнопку копирования */}
                    <IconButton
                      aria-label="Copy link"
                      icon={<CopyIcon />}
                      onClick={onCopy}
                      size="sm"
                      variant="outline"
                      borderColor={accentColor}
                      color={accentColor}
                      _hover={{ bg: "whiteAlpha.100" }}
                    />
                  </Tooltip>
                </HStack>
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
          {/* Стилизуем кнопку Закрыть */}
          <Button
            variant="ghost"
            onClick={onClose}
            isDisabled={isLoading}
            _hover={{ bg: "whiteAlpha.100" }}>
            Закрити
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
