// src/theme.js
import { extendTheme } from '@chakra-ui/react';

// 1. Определяем ваши фирменные цвета (замените на точные HEX коды!)
const colors = {
  brand: {
    purple: '#30283C', // Темно-фиолетовый логотипа
    gold: '#EFAF4A',   // Золотой/желтый логотипа
    goldHover: '#d79f3a', // Пример чуть более темного золотого для hover
    // Можно добавить оттенки фиолетового, если нужно
    // purpleLight: '#4a405a',
  },
};

// 2. Конфигурация: темная тема по умолчанию
const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

// 3. Глобальные стили: задаем фон для body в темном режиме
const styles = {
  global: (props) => ({
    'body': {
      bg: props.colorMode === 'dark' ? 'brand.purple' : 'gray.100', // Фиолетовый фон для темной темы
      color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.800', // Светлый текст для темной темы
    },
    // Можно стилизовать стандартные ссылки, если хотите их сделать золотыми
    // 'a': {
    //   color: props.colorMode === 'dark' ? 'brand.gold' : 'blue.500',
    //   _hover: {
    //      opacity: 0.8
    //   },
    // }
  }),
};

// 4. Создаем и экспортируем тему
const theme = extendTheme({
  config,
  colors,
  styles
});

export default theme;