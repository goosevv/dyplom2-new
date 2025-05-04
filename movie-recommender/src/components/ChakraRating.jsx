// src/components/ChakraRating.jsx (БЕЗ ИЗМЕНЕНИЙ)
import React, { useState } from "react";
import { HStack, Icon, useColorModeValue, Box } from "@chakra-ui/react";
import { FaStar, FaRegStar } from "react-icons/fa";

function ChakraRating({
  size = 20,
  initialValue = 0,
  value = 0,
  onChange,
  readonly = false,
  activeColor = "#FFC107", // Используется, если не передан извне
  inactiveColor,
  spacing = "1px",
}) {
  const defaultInactiveColor = useColorModeValue("gray.300", "gray.600");
  const _inactiveColor = inactiveColor || defaultInactiveColor;
  const [hoverValue, setHoverValue] = useState(0);
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  const handleClick = (clickedValue, e) => {
    e.stopPropagation();
    if (!readonly && onChange) {
      onChange(clickedValue);
    }
  };
  const handleMouseEnter = (hoveredValue) => {
    if (!readonly) {
      setHoverValue(hoveredValue);
    }
  };
  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(0);
    }
  };

  return (
    <HStack spacing={spacing} display="inline-flex" verticalAlign="middle">
      {stars.map((starValue) => {
        const ratingToShow = hoverValue || value;
        const IconComponent = starValue <= ratingToShow ? FaStar : FaRegStar;
        const starColor =
          starValue <= ratingToShow ? activeColor : _inactiveColor;
        return (
          <Box
            key={starValue}
            as="button"
            type="button"
            disabled={readonly}
            onClick={(e) => handleClick(starValue, e)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            cursor={readonly ? "default" : "pointer"}
            p={0}
            border="none"
            background="none"
            transition="transform 0.1s ease-in-out"
            _hover={!readonly ? { transform: "scale(1.2)" } : {}}
            _focus={{ boxShadow: "outline" }}
            aria-label={`Оцінка ${starValue} з 5`}>
            <Icon as={IconComponent} boxSize={`${size}px`} color={starColor} />
          </Box>
        );
      })}
    </HStack>
  );
}
export default ChakraRating;
