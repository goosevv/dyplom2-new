// src/components/SearchBox.jsx (СТИЛИЗОВАННАЯ ВЕРСИЯ)
import React from "react";
import { useCombobox } from "downshift";
import { Box, Input, List, ListItem, useToken } from "@chakra-ui/react";

export default function SearchBox({ items, onSelect, placeholder }) {
  // Получаем цвета из темы
  const [
    brandGold,
    brandPurple,
    whiteAlpha50,
    whiteAlpha100,
    whiteAlpha200,
    whiteAlpha300,
  ] = useToken("colors", [
    "brand.gold",
    "brand.purple",
    "whiteAlpha.50",
    "whiteAlpha.100",
    "whiteAlpha.200",
    "whiteAlpha.300",
  ]);

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
    inputValue,
  } = useCombobox({
    items,
    itemToString: (item) => (item ? item.title : ""),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onSelect(selectedItem);
    },
  });

  return (
    <Box w="100%" pos="relative">
      <Input
        {...getInputProps({ placeholder })}
        // Стилизация Input
        bg={whiteAlpha100} // Фон
        borderColor={whiteAlpha300} // Рамка
        _hover={{ borderColor: whiteAlpha200 }} // Рамка при наведении
        focusBorderColor={brandGold} // Золотая рамка при фокусе
        _placeholder={{ color: "gray.500" }}
        borderRadius="md"
      />
      {/* Выпадающий список */}
      <List
        position="absolute"
        width="100%"
        zIndex="dropdown"
        bg={brandPurple} // Фиолетовый фон (основной фон сайта)
        borderWidth={isOpen && items.length > 0 ? "1px" : "0"} // Показываем рамку только когда открыт и есть элементы
        borderColor={whiteAlpha300}
        borderRadius="md"
        boxShadow="md"
        maxH="240px"
        overflowY="auto"
        mt={1}
        {...getMenuProps()}>
        {isOpen &&
          items
            .filter(
              (i) =>
                inputValue === "" ||
                i.title.toLowerCase().includes(inputValue.toLowerCase())
            )
            .slice(0, 10)
            .map((item, index) => (
              <ListItem
                key={item.movieId}
                p={2}
                // Стиль элемента списка
                bg={highlightedIndex === index ? whiteAlpha200 : undefined} // Подсветка выбранного
                cursor="pointer"
                _hover={{ bg: whiteAlpha100 }} // Фон при наведении
                {...getItemProps({ item, index })}>
                {item.title}
              </ListItem>
            ))}
      </List>
    </Box>
  );
}
