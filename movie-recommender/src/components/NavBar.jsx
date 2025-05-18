// src/components/NavBar.jsx (Стилизация под цвета логотипа)
import React from 'react';
import {
  Flex, Box, HStack, Link, Button, Menu, MenuButton, MenuList, MenuItem,
  MenuDivider, Avatar, useColorModeValue, Spacer, IconButton, Image, Text, Container
} from '@chakra-ui/react';
import { NavLink, Link as RouterLink } from 'react-router-dom';
import { AuthContext } from "../context/AuthContext";
import LanguageSwitcher from './LanguageSwitcher'; // Убедитесь, что этот компонент стилизован схоже

import logoImage from '../assets/reelgoose-logo.png'; // <-- ВАШ ПУТЬ

export default function NavBar({ user, onLogout }) {

  // Используем цвета из темы!
  const headerBg = "brand.purple"; // Фон хедера - фирменный фиолетовый
  const linkColor = "white"; // Цвет ссылок оставляем белым для контраста
  const accentColor = "brand.gold"; // Акцентный цвет - фирменный золотой

  const activeLinkStyle = {
    fontWeight: 'bold',
    textDecoration: 'none',
    borderBottom: `2px solid ${accentColor}`, // Используем золотой для подчеркивания
    color: accentColor, // Можно сделать активную ссылку золотой
  };
   const hoverLinkStyle = {
    opacity: 0.8, // Стандартный эффект при наведении
    textDecoration: 'none',
  };
  const buttonHoverBg = "rgba(255, 255, 255, 0.1)"; // Легкий белый фон при наведении на кнопки/ссылки

  return (
    <Flex
      as="nav"
      position="sticky"
      top="0"
      left="0"
      w="100%"
      zIndex="banner"
      bg={headerBg} // Применяем фон
      color={linkColor} // Цвет текста по умолчанию для хедера
    >
      <Container maxW="container.xl" px={{ base: 4, md: 8 }} py={2}>
         <Flex align="center" justify="space-between" w="100%">

            {/* ЛОГОТИП + НАЗВАНИЕ */}
            <Box>
              <Link as={RouterLink} to={user ? "/recommendations" : "/"} _hover={{ opacity: 0.8 }}>
                <HStack spacing={{ base: 2, md: 3 }} align="center">
                  <Image src={logoImage} alt="ReelGoose Logo" h={{ base: "60px", md: "65px" }} /> {/* Немного увеличил */}
                  <Text
                    fontSize={{ base: "lg", md: "xl" }}
                    fontWeight="bold"
                    color={accentColor} // <<< Название золотым цветом
                    display={{ base: 'none', sm: 'block' }}
                  >
                    ReelGoose
                  </Text>
                </HStack>
              </Link>
            </Box>

            {/* НАВИГАЦИЯ */}
            {user && (
              <HStack spacing={{ base: 4, md: 8 }} display={{ base: 'none', md: 'flex' }}>
                {[
                  ['/recommendations', 'Рекомендації'],
                  ['/favorites', 'Улюблені'],
                  ['/mylists', 'Мої списки'],
                ].map(([to, label]) => (
                  <Link
                    as={NavLink} key={to} to={to} color={linkColor}
                    _hover={hoverLinkStyle} _activeLink={activeLinkStyle} px={2}
                  >
                    {label}
                  </Link>
                ))}
              </HStack>
            )}

            {/* ПРАВАЯ СТОРОНА */}
            <HStack spacing={{ base: 2, md: 4 }}> {/* Уменьшил spacing */}
              <LanguageSwitcher /> {/* Убедитесь, что его стиль соответствует */}

              {user ? (
                // Меню пользователя
                <Menu placement="bottom-end">
                  <MenuButton as={Button} rounded={'full'} variant={'link'} cursor={'pointer'} minW={0}>
                    <Avatar size={'sm'} name={user.name || user.email} bg={accentColor} color={headerBg} /> {/* Аватар в фирменных цветах */}
                  </MenuButton>
                  <MenuList /* Стили для меню можно добавить в тему */ >
                    <MenuItem as={RouterLink} to="/profile">
                      Профіль ({user.name || user.email})
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem onClick={onLogout} color="red.500" fontWeight="medium">
                      Вийти
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                // Вход/Регистрация
                <>
                  <Link as={NavLink} to="/login" color={linkColor} _hover={hoverLinkStyle} _activeLink={activeLinkStyle} fontSize={{ base: 'sm', md: 'md' }}>
                    Вхід
                  </Link>
                  <Button
                    as={NavLink} to="/register" size="sm" variant="outline"
                    borderColor={accentColor} // <<< Граница золотая
                    color={accentColor} // <<< Текст золотой
                    _hover={{ bg: accentColor, color: headerBg }} // <<< Инверсия цветов при наведении
                  >
                    Реєстрація
                  </Button>
                </>
              )}
            </HStack>

            {/* Мобильное меню пока не трогаем */}
         </Flex>
      </Container>
    </Flex>
  );
}