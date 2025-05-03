// src/components/NavBar.jsx
import React from "react";
import {
  Flex,
  Box,
  HStack,
  Link,
  Button,
  Menu, // Для выпадающего меню пользователя
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider, // Разделитель в меню
  Avatar, // Для отображения аватара/инициалов
  useColorModeValue, // Для цветов темы
  Spacer, // Чтобы разнести элементы
  IconButton, // Если захотите кнопку-бургер для мобильных
} from "@chakra-ui/react";
import { NavLink, Link as RouterLink } from "react-router-dom"; // NavLink для активных ссылок, Link для обычных
import LanguageSwitcher from "./LanguageSwitcher";
// import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'; // Иконки для мобильного меню (если нужно)

// Компонент теперь принимает user и onLogout
export default function NavBar({ user, onLogout }) {
  // Определяем цвет ссылок (белый, т.к. фон часто прозрачный/темный)
  const linkColor = "white";
  // Стили для активной ссылки в NavLink
  const activeLinkStyle = {
    // Можете выбрать стиль, например, подчеркивание или жирный шрифт
    // borderBottom: '2px solid white',
    fontWeight: "bold",
    textDecoration: "none",
  };
  // Стили при наведении на ссылки
  const hoverLinkStyle = {
    opacity: 0.8,
    textDecoration: "none",
  };

  // Можно добавить состояние для мобильного меню, если нужно
  // const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex
      as="nav"
      position="absolute" // Или fixed, если нужно при скролле
      top="0"
      left="0"
      w="100%"
      px={{ base: 4, md: 8 }}
      py={3}
      align="center"
      bg="transparent" // Фон прозрачный
      color={linkColor} // Цвет текста по умолчанию белый
      zIndex="banner"
      // Можно добавить тень при скролле, если position="fixed"
    >
      {/* Лого/Название слева */}
      <Box>
        <Link
          as={RouterLink} // Обычный Link для лого
          to={user ? "/recommendations" : "/"} // Ведет на рекомендации или главную
          fontSize={{ base: "xl", md: "2xl" }} // Адаптивный размер шрифта
          fontWeight="bold"
          color={linkColor}
          _hover={hoverLinkStyle}>
          MovieReco
        </Link>
      </Box>

      {/* Основные ссылки навигации (по центру) */}
      {/* Показываем только для залогиненных и только на десктопе (для мобильных можно сделать бургер-меню) */}
      {user && (
        <HStack
          spacing={{ base: 4, md: 6 }}
          mx="auto" // Центрирует блок ссылок
          display={{ base: "none", md: "flex" }} // Скрываем на мобильных, показываем на десктопе
        >
          {[
            // Путь, Метка
            ["/recommendations", "Рекомендації"],
            ["/favorites", "Улюблені"],
            // Можно добавить '/lists', когда будет страница списков
            // ['/lists', 'Мої списки'],
          ].map(([to, label]) => (
            <Link
              as={NavLink}
              key={to}
              to={to}
              color={linkColor}
              _hover={hoverLinkStyle}
              _activeLink={activeLinkStyle} // Стиль активной ссылки Chakra
            >
              {label}
            </Link>
          ))}
        </HStack>
      )}

      {/* Если пользователь не вошел, ставим Spacer, чтобы правая часть прижалась */}
      {!user && <Spacer />}

      {/* Элементы справа (Язык, Профиль/Вход) */}
      {/* Скрываем на мобильных, если нужно бургер-меню */}
      <HStack spacing={4} display={{ base: "none", md: "flex" }}>
        <LanguageSwitcher />

        {user ? (
          // Меню пользователя (если залогинен)
          <Menu placement="bottom-end">
            {" "}
            {/* Расположение меню */}
            <MenuButton
              as={Button}
              rounded={"full"}
              variant={"link"}
              cursor={"pointer"}
              minW={0}>
              <Avatar
                size={"sm"}
                name={user.name || user.email} // Инициалы по имени или email
                bg="teal.500"
                color="white"
              />
            </MenuButton>
            <MenuList
              bg={useColorModeValue("white", "gray.800")} // Фон меню в разных темах
              borderColor={useColorModeValue("gray.200", "gray.600")}
              color={useColorModeValue("gray.800", "white")} // Цвет текста меню
              zIndex="popover" // Убедимся, что меню поверх всего
            >
              <MenuItem
                as={RouterLink}
                to="/profile"
                _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}>
                Профіль ({user.name || user.email})
              </MenuItem>
              <MenuItem
                as={RouterLink} // Используем Link из react-router
                to="/mylists" // <<< Ссылка на новую страницу
                _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}>
                Мої списки
              </MenuItem>
              <MenuDivider />
              <MenuItem
                onClick={onLogout} // Вызываем выход
                _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                color="red.500"
                fontWeight="medium">
                Вийти
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          // Вход/Регистрация (если не залогинен)
          <>
            <Link
              as={NavLink}
              to="/login"
              color={linkColor}
              _hover={hoverLinkStyle}
              _activeLink={activeLinkStyle}>
              Вхід
            </Link>
            <Button
              as={NavLink}
              to="/register"
              size="sm"
              variant="outline"
              colorScheme="whiteAlpha"
              color={linkColor}
              _hover={{ bg: "whiteAlpha.200" }}>
              Реєстрація
            </Button>
          </>
        )}
      </HStack>

      {/* Кнопка Бургер-меню для мобильных (нужно добавить логику открытия/закрытия и само меню) */}
      {/*
      <IconButton
        size={'md'}
        icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
        aria-label={'Open Menu'}
        display={{ md: 'none' }} // Показываем только на мобильных
        onClick={isOpen ? onClose : onOpen}
        variant="ghost"
        color={linkColor}
        _hover={{bg: 'whiteAlpha.200'}}
      />
      */}
      {/* Здесь должно быть мобильное меню, если оно нужно */}
    </Flex>
  );
}
