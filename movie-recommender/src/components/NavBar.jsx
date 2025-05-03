// src/components/NavBar.jsx
import React from 'react';
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
  Spacer // Чтобы разнести элементы
} from '@chakra-ui/react';
import { NavLink, Link as RouterLink } from 'react-router-dom'; // NavLink для активных ссылок, Link для обычных
import LanguageSwitcher from './LanguageSwitcher';

// Компонент теперь принимает user и onLogout
export default function NavBar({ user, onLogout }) {
  // Определяем цвета фона и текста в зависимости от темы (можно убрать, если фон всегда прозрачный)
  // const bg = useColorModeValue('gray.100', 'gray.900');
  // const color = useColorModeValue('gray.800', 'white');

  // Определяем цвет ссылок (белый, т.к. фон прозрачный/темный на главной)
  const linkColor = "white";
  const activeLinkStyle = {
    borderBottom: '2px solid white',
    fontWeight: 'bold',
    textDecoration: 'none', // Убираем подчеркивание у активной ссылки NavLink
  };
   const hoverLinkStyle = {
    opacity: 0.8,
    textDecoration: 'none' // Убираем подчеркивание при наведении
  };


  return (
    <Flex
      as="nav"
      position="absolute" // Или fixed, если должен быть всегда виден при скролле
      top="0"
      left="0"
      w="100%"
      px={{ base: 4, md: 8 }} // Немного уменьшил отступы
      py={3} // Немного уменьшил отступы
      align="center"
      // justify="space-between" // Убираем, т.к. используем Spacer
      bg="transparent" // Фон прозрачный
      boxShadow="none"
      zIndex="banner" // Чтобы был поверх контента
    >
      {/* Лого/Название слева */}
      <Box>
        <Link
          as={RouterLink} // Используем обычный Link для лого
          to={user ? "/recommendations" : "/"} // Домой или в рекомендации
          fontSize="2xl"
          fontWeight="bold"
          color={linkColor}
          _hover={hoverLinkStyle}
        >
          MovieReco
        </Link>
      </Box>

      {/* Основные ссылки навигации (по центру) */}
      {/* Показываем только для залогиненных */}
      {user && (
        <HStack spacing={{ base: 4, md: 6 }} mx="auto"> {/* mx="auto" для центрирования */}
          {[
            // Убираем '/profile', т.к. он будет в меню пользователя
            ['/recommendations', 'Рекомендації'],
            ['/favorites', 'Улюблені'],
            // Можно добавить другие ссылки, если нужно
          ].map(([to, label]) => (
            <Link
              as={NavLink}
              key={to}
              to={to}
              color={linkColor}
              _hover={hoverLinkStyle}
              // Применяем стили для активной ссылки через _activeLink псевдопроп Chakra UI
              _activeLink={activeLinkStyle}
            >
              {label}
            </Link>
          ))}
        </HStack>
      )}

      {/* Пустой Spacer, чтобы разнести лого и правую часть */}
      {!user && <Spacer />} {/* Показываем Spacer если user не залогинен, т.к. нет центральных ссылок */}


      {/* Элементы справа (Язык, Профиль/Вход) */}
      <HStack spacing={4}>
        <LanguageSwitcher />

        {/* Условный рендеринг: Профиль/Выход ИЛИ Вход/Регистрация */}
        {user ? (
          // Если пользователь залогинен - показываем меню
          <Menu>
            <MenuButton
              as={Button}
              rounded={'full'}
              variant={'link'}
              cursor={'pointer'}
              minW={0}>
              {/* Аватарка или инициалы */}
              <Avatar
                size={'sm'}
                // Можно использовать name={user.name} для генерации инициалов
                // или src={'URL_АВАТАРКИ'} если есть
                name={user.name || user.email} // Используем имя или email для инициалов
                bg="teal.500" // Цвет фона аватарки
                color="white"
              />
            </MenuButton>
            <MenuList
              // Стили для выпадающего меню
               bg={useColorModeValue('white', 'gray.700')}
               borderColor={useColorModeValue('gray.200', 'gray.600')}
            >
              <MenuItem
                 as={RouterLink} // Используем Link из react-router
                 to="/profile"
                 _hover={{ bg: useColorModeValue('gray.100', 'gray.600')}}
              >
                Профіль ({user.name || user.email}) {/* Показываем имя или email */}
              </MenuItem>
              <MenuDivider />
              <MenuItem
                 onClick={onLogout} // Вызываем функцию выхода при клике
                 _hover={{ bg: useColorModeValue('gray.100', 'gray.600')}}
                 color="red.500" // Красный цвет для выхода
              >
                Вийти
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          // Если пользователь НЕ залогинен - показываем Вход/Регистрация
          <>
            <Link
              as={NavLink}
              to="/login"
              color={linkColor}
              _hover={hoverLinkStyle}
              _activeLink={activeLinkStyle}
            >
              Вхід
            </Link>
            <Button
              as={NavLink}
              to="/register"
              size="sm"
              variant="outline" // Сделаем контурной для прозрачного фона
              colorScheme="whiteAlpha" // Схема для белых контуров/текста
              color={linkColor}
              _hover={{ bg: 'whiteAlpha.200' }} // Легкий фон при наведении
            >
              Реєстрація
            </Button>
          </>
        )}
      </HStack>
    </Flex>
  );
}