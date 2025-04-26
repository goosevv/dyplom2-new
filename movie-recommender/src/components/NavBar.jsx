import React from 'react'
import { Flex, Box, HStack, Link, Button } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'

export default function NavBar() {
  return (
    <Flex
      as="nav"
      position="absolute"
      top="0"
      left="0"
      w="100%"
      px={{ base: 6, md: 12 }}
      py={4}
      align="center"
      justify="space-between"
      bg="transparent"
      boxShadow="none"
      zIndex="banner"
    >
      <Box>
        <Link
          as={NavLink}
          to="/"
          fontSize="2xl"
          fontWeight="bold"
          color="white"
          _hover={{ opacity: 0.8, textDecor: 'none' }}
        >
          MovieReco
        </Link>
      </Box>

      <HStack spacing={{ base: 4, md: 8 }}>
        {[
          ['/',               'Головна'],
          ['/recommendations','Рекомендації'],
          ['/favorites',      'Улюблені'],
          ['/profile',        'Профіль'],
        ].map(([to, label]) => (
          <Link
            as={NavLink}
            key={to}
            to={to}
            color="white"
            _hover={{ opacity: 0.8, textDecor: 'none' }}
            sx={{ '&.active': { borderBottom: '2px solid white', fontWeight: 'bold' } }}
          >
            {label}
          </Link>
        ))}
      </HStack>

      <HStack spacing={4}>
        <LanguageSwitcher />
        <Link
          as={NavLink}
          to="/login"
          color="white"
          _hover={{ opacity: 0.8, textDecor: 'none' }}
        >
          Вхід
        </Link>
        <Button
          as={NavLink}
          to="/register"
          size="sm"
          bg="whiteAlpha.800"
          color="black"
          _hover={{ bg: 'whiteAlpha.900' }}
        >
          Реєстрація
        </Button>
      </HStack>
    </Flex>
  )
}
