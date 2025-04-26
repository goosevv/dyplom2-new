// src/theme.js
import { extendTheme } from '@chakra-ui/react'

// Конфигурация: по умолчанию – тёмная тема
const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({ config })

export default theme
