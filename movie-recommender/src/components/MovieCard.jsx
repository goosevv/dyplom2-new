// src/components/MovieCard.jsx (СТИЛИЗОВАННАЯ ВЕРСИЯ)
import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  AspectRatio,
  Image,
  Heading,
  Text,
  IconButton,
  Spinner,
  Flex,
  Tooltip,
  useDisclosure,
  useToast,
  HStack,
  Icon,
  Center, // Добавлен Center
  // useColorModeValue убран
} from "@chakra-ui/react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import ChakraRating from "./ChakraRating";
import { TMDB_KEY, TMDB_API_BASE, TMDB_IMG_BASE } from "../config";
import { LocaleContext } from "../LocaleContext";
import AddToListsModal from "./AddToListsModal";
import { AddIcon } from "@chakra-ui/icons";
import { useTheme } from "@chakra-ui/react";

export default function MovieCard({ movie, onClickCard, showRating }) {
  const { tmdbLang } = useContext(LocaleContext);
  const [details, setDetails] = useState(null);
  const [liked, setLiked] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const {
    isOpen: isAddToListModalOpen,
    onOpen: onAddToListModalOpen,
    onClose: onAddToListModalClose,
  } = useDisclosure();
  const toast = useToast();
  const theme = useTheme();

  // Используем цвета из темы
  const cardBg = "whiteAlpha.50";
  const overlayBg = "rgba(48, 40, 60, 0.95)"; // Фиолетовый оверлей (brand.purple с альфа)
  const overlayColor = "white";
  const bottomBorderColor = "whiteAlpha.200";
  const placeholderRatingColor = "gray.600";
  const accentColor = theme.colors.brand.gold;
  const iconColor = "brand.gold"; // Используем токен
  const cardBorderColor = "whiteAlpha.200"; // Цвет рамки карточки
  const cardTextColor = "whiteAlpha.900"; // Основной цвет текста карточки

  // === Use Effects (логика без изменений) ===
  useEffect(() => {
    let isMounted = true;
    const titleQuery = movie.title.replace(/\s*\(\d{4}\)$/, "");
    const yearMatch = movie.title.match(/\((\d{4})\)$/);
    const params = { api_key: TMDB_KEY, language: tmdbLang, query: titleQuery };
    if (yearMatch) params.year = yearMatch[1];
    setDetails(null);
    axios
      .get(`${TMDB_API_BASE}/search/movie`, { params })
      .then((res) => {
        if (isMounted)
          setDetails(res.data.results?.[0] || { title: movie.title });
      })
      .catch(() => {
        if (isMounted) setDetails({ title: movie.title });
        console.error(`Failed to fetch details for: ${movie.title}`);
      });
    return () => {
      isMounted = false;
    };
  }, [movie.movieId, movie.title, tmdbLang]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLiked(false);
      setUserRating(0);
      return;
    }
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    let isMounted = true;
    const headers = { Authorization: `Bearer ${token}` };
    axios
      .get(`/api/ratings/${userId}`, { headers })
      .then((res) => {
        if (isMounted) {
          const rec = res.data.find((r) => r.movieId === movie.movieId);
          setUserRating(rec ? rec.score : 0);
        }
      }) // Используем .rating
      .catch((err) => console.error("Failed to fetch ratings:", err));
    axios
      .get("/api/recommend/user/favorites", { headers })
      .then((res) => {
        if (isMounted)
          setLiked(res.data.some((m) => m.movieId === movie.movieId));
      })
      .catch((err) => console.error("Failed to fetch favorites:", err));
    return () => {
      isMounted = false;
    };
  }, [movie.movieId]);

  // === Обработчики (логика без изменений) ===
  const token = localStorage.getItem("token");
  const loggedIn = Boolean(token);

  const handleRatingChange = (newRating) => {
    if (!loggedIn) return;
    const previousRating = userRating;
    setUserRating(newRating);
    // ВАЖНО: Убедитесь, что бэкенд ожидает 'score' в теле запроса
    axios
      .post(
        "/api/ratings",
        { movieId: movie.movieId, score: newRating },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .catch((err) => {
        console.error("Failed to save rating:", err);
        setUserRating(previousRating);
      });
  };

  const toggleLike = (e) => {
    e.stopPropagation();
    if (!loggedIn) return;
    const currentLiked = liked;
    setLiked(!currentLiked);
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
    const data = { movieId: movie.movieId };
    const request = currentLiked
      ? axios.delete("/api/recommend/user/favorites", { ...config, data: data })
      : axios.post("/api/recommend/user/favorites", data, config);
    request.catch((err) => {
      console.error(`Failed to ${currentLiked ? "unlike" : "like"}:`, err);
      setLiked(currentLiked);
    });
  };

  const handleOpenAddToList = (e) => {
    e.stopPropagation();
    if (!loggedIn) {
      toast({
        title: "Потрібна авторизація",
        description: "Увійдіть до системи, щоб додавати фільми до списків.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onAddToListModalOpen();
  };

  // === Спиннер ===
  if (details === null) {
    return (
      <Center
        h="350px"
        bg={cardBg}
        boxShadow="md"
        borderRadius="lg"
        borderWidth="1px"
        borderColor={cardBorderColor}>
        <Spinner size="xl" color="brand.gold" />
      </Center>
    );
  }

  // === Основной рендеринг ===
  const poster = details.poster_path
    ? `${TMDB_IMG_BASE}${details.poster_path}`
    : "/placeholder.png";
  const year =
    details.release_date?.slice(0, 4) ||
    movie.title.match(/\((\d{4})\)$/)?.[1] ||
    "";
  const genres = (details.genres || []).map((g) => g.name).join(", ");
  const overview = details.overview || "Опис відсутній.";
  const displayTitle = details?.title || movie.title;

  return (
    <>
      <Box
        pos="relative"
        maxW="sm"
        w="100%"
        bg={cardBg}
        boxShadow="md"
        borderRadius="lg"
        overflow="hidden"
        cursor="pointer"
        transition="transform .2s, box-shadow .2s"
        _hover={{ transform: "scale(1.02)", boxShadow: "lg" }}
        borderWidth="1px"
        borderColor={cardBorderColor} // Рамка карточки
        color={cardTextColor} // Основной цвет текста для карточки
      >
        <AspectRatio ratio={2 / 3} onClick={onClickCard}>
          <Image
            src={poster}
            alt={displayTitle}
            objectFit="cover"
            fallbackSrc="/placeholder.png"
          />
        </AspectRatio>

        <Box p={3} onClick={onClickCard}>
          <Heading as="h5" size="sm" isTruncated title={displayTitle}>
            {" "}
            {/* Убрали явный цвет, унаследует */}
            {displayTitle}
          </Heading>
        </Box>

        {/* Оверлей */}
        <Box
          pos="absolute"
          inset="0"
          bg={overlayBg}
          opacity={0}
          _hover={{ opacity: 1 }}
          transition="opacity .3s"
          display="flex"
          flexDirection="column"
          p={3}
          borderRadius="lg" // Добавили скругление для оверлея
        >
          <Heading
            as="h4"
            size="md"
            mb={1}
            noOfLines={2}
            color={overlayColor}
            onClick={onClickCard}>
            {displayTitle}
          </Heading>
          <Box
            flex="1"
            overflowY="auto"
            mb={2}
            className="custom-scrollbar"
            onClick={onClickCard}>
            <Text fontSize="sm" color={overlayColor}>
              {" "}
              {overview}{" "}
            </Text>
          </Box>

          {/* Нижняя плашка */}
          <Flex
            align="center"
            justify="space-between"
            borderTop="1px solid"
            borderColor={bottomBorderColor}
            pt={2}
            mt="auto">
            <Text
              fontSize="xs"
              color="gray.400"
              isTruncated
              maxW="40%"
              onClick={onClickCard}>
              {" "}
              {/* Сделали текст года/жанров светлее */}
              {year} {genres && ` • ${genres}`}
            </Text>

            {/* Рейтинг */}
            {showRating &&
              (loggedIn ? (
                <Box as="span" display="inline-block" verticalAlign="middle">
                  <ChakraRating
                    value={userRating}
                    onChange={handleRatingChange}
                    size={18}
                    readonly={false}
                    activeColor={accentColor} // Золотой
                    inactiveColor={"gray.600"} // Неактивный для темной темы
                  />
                </Box>
              ) : (
                <Tooltip label="Увійдіть, щоб оцінити" hasArrow>
                  <Box
                    color={placeholderRatingColor}
                    fontSize="1.1rem"
                    lineHeight="1"
                    verticalAlign="middle">
                    ★★★★★
                  </Box>
                </Tooltip>
              ))}

            {/* Иконки Лайк и Добавить */}
            <HStack spacing={1}>
              <Tooltip
                label={liked ? "Прибрати з улюблених" : "Додати до улюблених"}
                hasArrow>
                <IconButton
                  aria-label="Like"
                  icon={
                    liked ? (
                      <Icon as={FaHeart} color="red.500" />
                    ) : (
                      <Icon as={FaRegHeart} />
                    )
                  }
                  onClick={toggleLike}
                  variant="ghost"
                  size="sm"
                  isRound
                  fontSize="18px"
                  color={liked ? "red.500" : iconColor} // Золотой для неактивного
                  _hover={{ bg: "whiteAlpha.100" }}
                />
              </Tooltip>
              <Tooltip label="Додати до списку" hasArrow>
                <IconButton
                  aria-label="Add to list"
                  icon={<AddIcon />}
                  onClick={handleOpenAddToList}
                  variant="ghost"
                  size="sm"
                  isRound
                  fontSize="14px"
                  color={iconColor} // Золотой
                  _hover={{ bg: "whiteAlpha.100" }}
                />
              </Tooltip>
            </HStack>
          </Flex>
        </Box>
      </Box>
      {/* Модальное окно */}
      <AddToListsModal
        isOpen={isAddToListModalOpen}
        onClose={onAddToListModalClose}
        movieId={movie.movieId}
        movieTitle={displayTitle}
      />
    </>
  );
}
