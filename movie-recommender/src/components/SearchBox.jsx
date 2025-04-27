// src/components/SearchBox.jsx
import React from 'react';
import { useCombobox } from 'downshift';
import { Box, Input, List, ListItem, useColorModeValue } from '@chakra-ui/react';

export default function SearchBox({ items, onSelect, placeholder }) {
  const bgHover = useColorModeValue('gray.100', 'gray.600');
  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
    inputValue
  } = useCombobox({
    items,
    itemToString: item => (item ? item.title : ''),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onSelect(selectedItem);
    }
  });

  return (
    <Box w="100%" pos="relative">
      <Input {...getInputProps({ placeholder })} />
      <List
        zIndex="dropdown"
        bg={useColorModeValue('white','gray.700')}
        border="1px solid"
        borderColor={useColorModeValue('gray.200','gray.600')}
        maxH="240px"
        overflowY="auto"
        {...getMenuProps()}
      >
        {isOpen &&
          items
            .filter(i => inputValue === '' || i.title.toLowerCase().includes(inputValue.toLowerCase()))
            .slice(0, 10)
            .map((item, index) => (
              <ListItem
                key={item.movieId}
                p={2}
                bg={highlightedIndex === index ? bgHover : undefined}
                cursor="pointer"
                {...getItemProps({ item, index })}
              >
                {item.title}
              </ListItem>
            ))}
      </List>
    </Box>
  );
}
