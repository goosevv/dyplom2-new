import React, { useContext } from 'react'
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  useColorModeValue
} from '@chakra-ui/react'
import { LocaleContext } from '../LocaleContext'

// кнопка-селектор языка для TMDb
export default function LanguageSwitcher() {
  const { tmdbLang, setTmdbLang } = useContext(LocaleContext)
  const color = useColorModeValue('gray.800', 'white')

  return (
    <Menu>
      <MenuButton as={Button} size="sm" variant="ghost" color={color}>
        {tmdbLang}
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => setTmdbLang('uk-UA')}>Українська</MenuItem>
        <MenuItem onClick={() => setTmdbLang('ru-RU')}>Русский</MenuItem>
        <MenuItem onClick={() => setTmdbLang('en-US')}>English</MenuItem>
      </MenuList>
    </Menu>
  )
}
