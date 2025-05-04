// src/components/MovieModal.jsx (СТИЛИЗОВАННАЯ ВЕРСИЯ)
import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Spinner,
  Center,
  Box,
  // useColorModeValue убран
} from "@chakra-ui/react";
import axios from "axios";
import { TMDB_KEY, TMDB_API_BASE } from "../config";
import { LocaleContext } from "../LocaleContext";
import { useTheme } from "@chakra-ui/react"; // Импорт useTheme

export default function MovieModal({ isOpen, onClose, movieId }) {
  const { tmdbLang } = useContext(LocaleContext);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const theme = useTheme(); // Получаем тему

  useEffect(() => {
    if (!movieId || !isOpen) {
      setDetails(null);
      return;
    }
    setLoading(true);
    const cancelToken = axios.CancelToken.source();
    axios
      .get(`${TMDB_API_BASE}/movie/${movieId}`, {
        params: { api_key: TMDB_KEY, language: tmdbLang },
        cancelToken: cancelToken.token,
      })
      .then((res) => setDetails(res.data))
      .catch((err) => {
        if (!axios.isCancel(err)) {
          console.error("Failed to fetch modal details:", err);
        }
      })
      .finally(() => {
        setLoading(false);
      });
    return () => {
      cancelToken.cancel();
      setLoading(false);
    };
  }, [movieId, tmdbLang, isOpen]);

  // Используем цвета темы
  const modalBg = "brand.purple";
  const headerColor = "brand.gold";
  const bodyColor = "whiteAlpha.900";
  const metaColor = "gray.400"; // Сделали светлее
  const borderColor = "whiteAlpha.200"; // Цвет рамок

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      scrollBehavior="inside"
      isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent
        bg={modalBg}
        color={bodyColor}
        borderRadius="xl" /*borderWidth="1px" borderColor={borderColor}*/
      >
        {" "}
        {/* Убрали внешнюю рамку */}
        {loading ? (
          <Center h="300px">
            <Spinner size="xl" color="brand.gold" />
          </Center>
        ) : details ? (
          <>
            <ModalHeader
              color={headerColor}
              borderBottomWidth="1px"
              borderColor={borderColor}
              fontSize="xl"
              pb={3}>
              {" "}
              {/* Уменьшили паддинг снизу */}
              {details.title} ({details.release_date?.slice(0, 4)})
            </ModalHeader>
            <ModalCloseButton
              _hover={{ bg: "whiteAlpha.200" }}
              top="14px"
              right="14px"
            />{" "}
            {/* Поправили позицию кнопки */}
            <ModalBody py={5}>
              {" "}
              {/* Увеличили вертикальный паддинг */}
              <Text mb={4}>{details.overview || "Опис відсутній."}</Text>
              <Text fontSize="sm" color={metaColor} mt={4}>
                Жанри:&nbsp;
                {details.genres?.map((g) => g.name).join(", ") || "не вказано"}
              </Text>
              <Text fontSize="sm" color={metaColor}>
                Компанії:&nbsp;
                {details.production_companies?.map((c) => c.name).join(", ") ||
                  "не вказано"}
              </Text>
              <Text fontSize="sm" color={metaColor}>
                Реліз: {details.release_date || "не вказано"}
              </Text>
              {details.vote_average > 0 && (
                <Text fontSize="sm" color={metaColor}>
                  Рейтинг TMDb: {details.vote_average.toFixed(1)} (
                  {details.vote_count} голосів)
                </Text>
              )}
              {details.homepage && (
                <Text fontSize="sm" color={metaColor}>
                  Сайт:&nbsp;
                  <Link
                    href={details.homepage}
                    isExternal
                    color="blue.300"
                    _hover={{ color: "blue.200" }}>
                    {details.homepage} <ExternalLinkIcon mx="2px" />
                  </Link>
                </Text>
              )}
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
              {/* Стилизуем кнопку Закрыть как второстепенную */}
              <Button
                variant="outline"
                onClick={onClose}
                borderColor="brand.gold"
                color="brand.gold"
                _hover={{ bg: "whiteAlpha.100" }}>
                Закрити
              </Button>
            </ModalFooter>
          </>
        ) : (
          <Box p={6}>
            <ModalHeader color={headerColor}>Помилка</ModalHeader>
            <ModalCloseButton _hover={{ bg: "whiteAlpha.200" }} />
            <ModalBody>
              <Text>Не вдалося завантажити деталі фільму.</Text>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                onClick={onClose}
                borderColor="brand.gold"
                color="brand.gold"
                _hover={{ bg: "whiteAlpha.100" }}>
                Закрити
              </Button>
            </ModalFooter>
          </Box>
        )}
      </ModalContent>
    </Modal>
  );
}
