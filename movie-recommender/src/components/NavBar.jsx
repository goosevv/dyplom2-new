// src/components/NavBar.jsx
import React from 'react';
import {
  Flex,
  Box,
  HStack,
  Link,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  useColorModeValue,
  Spacer,
  IconButton
} from '@chakra-ui/react';
import { NavLink, Link as RouterLink } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
// import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'; // Для мобильного меню

export default function NavBar({ user, onLogout }) {

  const linkColor = "white";
  const activeLinkStyle = {
    fontWeight: 'bold',
    textDecoration: 'none',
    borderBottom: '2px solid white', // Добавим подчеркивание для активной ссылки
  };
   const hoverLinkStyle = {
    opacity: 0.8,
    textDecoration: 'none'
  };

  // const { isOpen, onOpen, onClose } = useDisclosure(); // Для мобильного меню

  return (
    <Flex
      as="nav"
      position="absolute"
      top="0"
      left="0"
      w="100%"
      px={{ base: 4, md: 8 }}
      py={3}
      align="center"
      bg="transparent"
      color={linkColor}
      zIndex="banner"
    >
      {/* Лого */}
      <Box>
        <Link
          as={RouterLink}
          to={user ? "/recommendations" : "/"}
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="bold"
          color={linkColor}
          _hover={hoverLinkStyle}
        >
          MovieReco
        </Link>
      </Box>

      {/* Основные ссылки (только для залогиненных, по центру) */}
      {user && (
        <HStack
          spacing={{ base: 4, md: 8 }} // Увеличим немного отступ
          mx="auto"
          display={{ base: 'none', md: 'flex' }}
        >
          {[
            // Путь, Метка
            ['/recommendations', 'Рекомендації'],
            ['/favorites', 'Улюблені'],
            ['/mylists', 'Мої списки'], // <<< ПЕРЕМЕСТИЛИ СЮДА
          ].map(([to, label]) => (
            <Link
              as={NavLink}
              key={to}
              to={to}
              color={linkColor}
              _hover={hoverLinkStyle}
              _activeLink={activeLinkStyle}
              px={2} // Небольшой горизонтальный padding
            >
              {label}
            </Link>
          ))}
        </HStack>
      )}

      {/* Spacer если не залогинен */}
      {!user && <Spacer />}

      {/* Элементы справа */}
      <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
        <LanguageSwitcher />

        {user ? (
          // Меню пользователя
          <Menu placement="bottom-end">
            <MenuButton
              as={Button}
              rounded={'full'}
              variant={'link'}
              cursor={'pointer'}
              minW={0}>
              <Avatar
                size={'sm'}
                name={user.name || user.email}
                bg="teal.500"
                color="white"
              />
            </MenuButton>
            <MenuList
              bg={useColorModeValue('white', 'gray.800')}
              borderColor={useColorModeValue('gray.200', 'gray.600')}
              color={useColorModeValue('gray.800', 'white')}
              zIndex="popover"
            >
              <MenuItem
                 as={RouterLink}
                 to="/profile"
                 _hover={{ bg: useColorModeValue('gray.100', 'gray.700')}}
              >
                Профіль ({user.name || user.email})
              </MenuItem>
              {/* Ссылка "Мої списки" УБРАНА ОТСЮДА */}
              <MenuDivider />
              <MenuItem
                 onClick={onLogout}
                 _hover={{ bg: useColorModeValue('gray.100', 'gray.700')}}
                 color="red.500"
                 fontWeight="medium"
              >
                Вийти
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          // Вход/Регистрация
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
              variant="outline"
              colorScheme="whiteAlpha"
              color={linkColor}
              _hover={{ bg: 'whiteAlpha.200' }}
            >
              Реєстрація
            </Button>
          </>
        )}
      </HStack>

      {/* Мобильное меню (закомментировано) */}
      {/* ... */}
    </Flex>
  );
}