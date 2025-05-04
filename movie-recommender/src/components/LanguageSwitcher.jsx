// src/components/LanguageSwitcher.jsx (СТИЛИЗОВАННАЯ ВЕРСИЯ)
import React, { useContext } from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Text,
  HStack,
} from "@chakra-ui/react";
import { LocaleContext } from "../LocaleContext";
import { useTheme } from "@chakra-ui/react";

const flags = { "uk-UA": "🇺🇦", "en-US": "🇺🇸" };
const langLabels = { "uk-UA": "UA", "en-US": "EN" };

export default function LanguageSwitcher() {
  const { tmdbLang, setTmdbLang } = useContext(LocaleContext);
  const theme = useTheme();

  const currentFlag = flags[tmdbLang] || "";
  const currentLabel = langLabels[tmdbLang] || tmdbLang;

  // Используем цвета темы
  const menuBg = "brand.purple";
  const menuItemHoverBg = "whiteAlpha.200";
  const menuItemActiveBg = "whiteAlpha.100"; // Для подсветки активного
  const menuBorderColor = "whiteAlpha.300";
  const buttonColor = "white"; // Цвет текста/иконки на кнопке

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        size="sm"
        variant="ghost"
        color={buttonColor}
        _hover={{ bg: menuItemHoverBg }} // Эффект наведения на саму кнопку
        _active={{ bg: menuItemHoverBg }}
        aria-label="Change language">
        <HStack spacing="1">
          {currentFlag && <Text fontSize="lg">{currentFlag}</Text>}
          <Text>{currentLabel}</Text>
        </HStack>
      </MenuButton>
      <MenuList
        bg={menuBg} // Фиолетовый фон
        borderColor={menuBorderColor} // Рамка
        boxShadow="lg" // Тень побольше
        zIndex="popover"
        minW="150px" // Минимальная ширина меню
      >
        <MenuItem
          onClick={() => setTmdbLang("uk-UA")}
          _hover={{ bg: menuItemHoverBg }}
          bg={tmdbLang === "uk-UA" ? menuItemActiveBg : "transparent"} // Подсветка активного
        >
          <HStack spacing="2">
            {" "}
            <Text fontSize="lg">🇺🇦</Text> <Text>Українська</Text>{" "}
          </HStack>
        </MenuItem>
        <MenuItem
          onClick={() => setTmdbLang("en-US")}
          _hover={{ bg: menuItemHoverBg }}
          bg={tmdbLang === "en-US" ? menuItemActiveBg : "transparent"} // Подсветка активного
        >
          <HStack spacing="2">
            {" "}
            <Text fontSize="lg">🇺🇸</Text> <Text>English</Text>{" "}
          </HStack>
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
