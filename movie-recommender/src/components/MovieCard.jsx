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
  useColorModeValue,
  useDisclosure,
  useToast,
  HStack
} from "@chakra-ui/react";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa"; // Добавил FaStar для примера
import ChakraRating from "./ChakraRating"; // Убедитесь, что путь правильный
import { TMDB_KEY, TMDB_API_BASE, TMDB_IMG_BASE } from "../config"; // Убедитесь, что путь к config правильный
import { LocaleContext } from "../LocaleContext"; // Убедитесь, что путь правильный
import AddToListsModal from "./AddToListsModal"; // <<< Импорт новой модалки
import { AddIcon } from '@chakra-ui/icons';
export default function MovieCard({ movie, onClickCard, showRating }) {
  // === 1. ХУКИ ===
  const { tmdbLang } = useContext(LocaleContext);
  const [details, setDetails] = useState(null);
  const [liked, setLiked] = useState(false);
  const [userRating, setUserRating] = useState(0); // Рейтинг пользователя для этого фильма
  const {
    isOpen: isAddToListModalOpen,
    onOpen: onAddToListModalOpen,
    onClose: onAddToListModalClose,
  } = useDisclosure(); // <<< Хук для модалки
  const toast = useToast(); // <<< Хук для уведомлений

  // Цвета для темной/светлой темы
  const cardBg = useColorModeValue("white", "gray.700");
  const overlayBg = useColorModeValue(
    "rgba(255,255,255,0.95)",
    "rgba(18, 20, 22, 0.95)"
  ); // Сделал чуть плотнее
  const overlayColor = useColorModeValue("gray.800", "white");
  const bottomBorderColor = useColorModeValue("gray.200", "gray.600");
  const placeholderRatingColor = useColorModeValue("gray.300", "gray.500"); // Цвет для плейсхолдера звезд
  const emptyStarColor = useColorModeValue("gray.300", "gray.600"); // Цвет пустых звезд в Rating

  // Effect: Загрузка деталей фильма с TMDb
  useEffect(() => {
    let isMounted = true;
    const titleQuery = movie.title.replace(/\s*\(\d{4}\)$/, "");
    const yearMatch = movie.title.match(/\((\d{4})\)$/);
    const params = { api_key: TMDB_KEY, language: tmdbLang, query: titleQuery };
    if (yearMatch) params.year = yearMatch[1];

    // Сбрасываем детали при смене фильма, чтобы показать спиннер
    setDetails(null);

    axios
      .get(`${TMDB_API_BASE}/search/movie`, { params })
      .then((res) => {
        // Используем первый результат или заглушку с названием
        if (isMounted)
          setDetails(res.data.results?.[0] || { title: movie.title });
      })
      .catch(() => {
        if (isMounted) setDetails({ title: movie.title }); // Заглушка при ошибке
        console.error(`Failed to fetch details for: ${movie.title}`);
      });

    return () => {
      isMounted = false;
    };
    // Зависимости: ID фильма (если есть), название и язык
  }, [movie.movieId, movie.title, tmdbLang]);

  // Effect: Загрузка лайков и оценок пользователя (только если залогинен)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLiked(false);
      setUserRating(0);
      return; // Выходим, если нет токена
    }

    const userId = localStorage.getItem("user_id");
    if (!userId) return; // Нет ID пользователя

    let isMounted = true;
    const headers = { Authorization: `Bearer ${token}` };

    // Загрузка оценок
    axios
      .get(`/api/ratings/${userId}`, { headers })
      .then((res) => {
        if (isMounted) {
          const rec = res.data.find((r) => r.movieId === movie.movieId);
          setUserRating(rec ? rec.score : 0); // Устанавливаем 0, если оценки нет
        }
      })
      .catch((err) => console.error("Failed to fetch ratings:", err));

    // Загрузка лайков
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
    // Зависимость только от ID фильма (и неявно от логина, т.к. token проверяется в начале)
  }, [movie.movieId]);

  // === 2. ОБРАБОТЧИКИ ===
  const token = localStorage.getItem("token"); // Получаем токен снова для обработчиков
  const loggedIn = Boolean(token);

  // --- Обработчик изменения рейтинга (упрощенный) ---
  const handleRatingChange = (newRating) => {
    // stopPropagation больше не нужен здесь
    if (!loggedIn) return;

    const previousRating = userRating;
    setUserRating(newRating); // Оптимистичное обновление UI

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
        setUserRating(previousRating); // Откат UI при ошибке
        // TODO: Показать ошибку пользователю
      });
  };

  // --- Обработчик лайка ---
  const toggleLike = (e) => {
    e.stopPropagation(); // Останавливаем всплытие
    if (!loggedIn) return;

    const currentLiked = liked;
    setLiked(!currentLiked); // Оптимистичное обновление

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
      setLiked(currentLiked); // Откат UI
      // TODO: Показать ошибку пользователю
    });
  };

  // --- Функция для открытия модалки добавления в список ---
  const handleOpenAddToList = (e) => {
    e.stopPropagation(); // Останавливаем всплытие, чтобы не сработал onClickCard
    if (!loggedIn) {
      // Проверяем, залогинен ли пользователь
      toast({
        title: "Потрібна авторизація",
        description: "Увійдіть до системи, щоб додавати фільми до списків.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onAddToListModalOpen(); // Открываем модальное окно
  };

  // === 3. УСЛОВНЫЙ РЕНДЕРИНГ (Спиннер) ===
  if (details === null) {
    return (
      <Box
        maxW="sm"
        w="100%"
        h="350px" // Фиксированная высота
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={cardBg}
        boxShadow="md"
        borderRadius="md">
        <Spinner size="xl" />
      </Box>
    );
  }

  // === 4. ОСНОВНОЙ РЕНДЕРИНГ ===
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
      borderRadius="md"
      overflow="hidden"
      cursor="pointer"
      // onClick НЕ вешаем сюда, чтобы избежать случайных срабатываний при клике на кнопки/звезды
      transition="transform .2s, box-shadow .2s"
      _hover={{ transform: "scale(1.02)", boxShadow: "lg" }}>
      {/* --- Постер (можно сделать кликабельным) --- */}
      <AspectRatio ratio={2 / 3} onClick={onClickCard}>
        <Image
          src={poster}
          alt={displayTitle}
          objectFit="cover"
          fallbackSrc="/placeholder.png"
        />
      </AspectRatio>

      {/* --- Название под постером --- */}
      <Box p={2} onClick={onClickCard}>
        <Heading as="h5" size="sm" isTruncated title={displayTitle}>
          {displayTitle}
        </Heading>
      </Box>

      {/* --- Оверлей при наведении --- */}
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
        // onClick НЕ вешаем сюда
      >
        {/* Заголовок */}
        <Heading
          as="h4"
          size="md"
          mb={1}
          noOfLines={2}
          color={overlayColor}
          onClick={onClickCard}>
          {displayTitle}
        </Heading>
        {/* Описание */}
        <Box
          flex="1"
          overflowY="auto"
          mb={2}
          className="custom-scrollbar"
          onClick={onClickCard}>
          <Text fontSize="sm" color={overlayColor}>
            {overview}
          </Text>
        </Box>

        {/* --- Нижняя плашка (НЕ кликабельная) --- */}
        <Flex
          align="center"
          justify="space-between"
          borderTop="1px solid"
          borderColor={bottomBorderColor}
          pt={2}
          mt="auto">
          {/* Год и жанры */}
          <Text
            fontSize="xs"
            color="gray.500"
            isTruncated
            maxW={{ base: "30%", md: "40%" }}
            onClick={onClickCard}>
            {year}
            {genres && ` • ${genres}`}
          </Text>

          {/* --- Рейтинг (Звезды) --- */}
          {showRating &&
            (loggedIn ? (
              // Используем НОВЫЙ компонент Rating
              // Обертка Box для контроля display и verticalAlign
              <Box as="span" display="inline-block" verticalAlign="middle">
                <ChakraRating
                  value={userRating} // Передаем текущий рейтинг
                  onChange={handleRatingChange} // Передаем обработчик клика
                  size={20} // Задаем размер
                  readonly={false} // Позволяем изменять
                  // activeColor можно не передавать, если устраивает золотой по умолчанию
                  // inactiveColor можно не передавать, если устраивает серый по умолчанию
                />
              </Box>
            ) : (
              // Плейсхолдер для неавторизованных
              <Tooltip label="Увійдіть, щоб оцінити" hasArrow>
                <Box
                  color={placeholderRatingColor}
                  fontSize="1.25rem"
                  lineHeight="1"
                  verticalAlign="middle">
                  ★★★★★
                </Box>
              </Tooltip>
            ))}
          <HStack spacing={1}> {/* HStack для группировки кнопок */}
          {/* --- Лайк --- */}
          <IconButton
            aria-label="Нравится"
            icon={liked ? <FaHeart color="red" /> : <FaRegHeart />}
            onClick={toggleLike} // toggleLike уже имеет stopPropagation
            variant="ghost"
            size="sm"
            isRound
            fontSize="18px"
          />
          <IconButton
                aria-label="Додати до списку"
                icon={<AddIcon />} // Используем AddIconы
                onClick={handleOpenAddToList} // Открываем модалку
                variant="ghost"
                size="sm"
                isRound
                fontSize="14px" // Можно подстроить размер иконки
              />
          </HStack>
        </Flex>
      </Box>
    </Box>
    <AddToListsModal
      isOpen={isAddToListModalOpen}
      onClose={onAddToListModalClose}
      movieId={movie.movieId} // Передаем ID фильма
      movieTitle={displayTitle} // Передаем название фильма
     />
    </>
  );
}
