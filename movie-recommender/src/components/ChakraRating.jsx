// src/components/ChakraRating.jsx
import React, { useState } from 'react';
import { HStack, Icon, useColorModeValue, Box } from '@chakra-ui/react';
import { FaStar, FaRegStar } from 'react-icons/fa'; // Используем иконки звезд

// Наш новый компонент рейтинга
function ChakraRating({
  size = 20,                   // Размер иконок по умолчанию
  initialValue = 0,            // Начальное значение (если не передано value)
  value = 0,                   // Текущее значение рейтинга (управляемое)
  onChange,                    // Функция обратного вызова при изменении (newValue) => void
  readonly = false,            // Флаг "только для чтения"
  activeColor = '#FFC107',     // Цвет активных звезд (золотой/желтый)
  inactiveColor,               // Цвет неактивных/пустых звезд (определим ниже)
  spacing = '1px',             // Расстояние между звездами
}) {
  // Определяем цвет неактивных звезд в зависимости от темы
  const defaultInactiveColor = useColorModeValue('gray.300', 'gray.600');
  const _inactiveColor = inactiveColor || defaultInactiveColor;

  // Состояние для отслеживания звезды, на которую наведен курсор
  const [hoverValue, setHoverValue] = useState(0);

  // Массив для итерации (5 звезд)
  const stars = Array.from({ length: 5 }, (_, i) => i + 1); // [1, 2, 3, 4, 5]

  // Обработчик клика по звезде
  const handleClick = (clickedValue, e) => {
    // Останавливаем всплытие, чтобы не сработал onClick родительской карточки!
    e.stopPropagation();
    if (!readonly && onChange) {
      onChange(clickedValue); // Вызываем переданный обработчик с новым значением
    }
  };

  // Обработчик наведения мыши на звезду
  const handleMouseEnter = (hoveredValue) => {
    if (!readonly) {
      setHoverValue(hoveredValue);
    }
  };

  // Обработчик увода мыши со звезды
  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(0); // Сбрасываем значение при уводе мыши
    }
  };

  return (
    // HStack для горизонтального расположения звезд
    <HStack spacing={spacing} display="inline-flex" verticalAlign="middle">
      {stars.map((starValue) => {
        // Определяем, какую иконку показать (заполненную или пустую)
        // Учитываем и текущее значение (value), и значение при наведении (hoverValue)
        const ratingToShow = hoverValue || value;
        const IconComponent = starValue <= ratingToShow ? FaStar : FaRegStar;
        // Определяем цвет звезды
        const starColor = starValue <= ratingToShow ? activeColor : _inactiveColor;

        return (
          <Box
            key={starValue}
            as="button" // Делаем звезду кнопкой для доступности
            type="button" // Указываем тип, чтобы не отправлять форму
            disabled={readonly}
            onClick={(e) => handleClick(starValue, e)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            cursor={readonly ? 'default' : 'pointer'}
            p={0} // Убираем padding у кнопки
            border="none" // Убираем рамку у кнопки
            background="none" // Убираем фон у кнопки
            // Применяем transition для плавности эффекта hover
            transition="transform 0.1s ease-in-out"
            _hover={!readonly ? { transform: 'scale(1.2)' } : {}} // Небольшое увеличение при наведении
            _focus={{ boxShadow: 'outline' }} // Стиль фокуса Chakra
            aria-label={`Оцінка ${starValue} з 5`} // Для доступности
          >
            <Icon
              as={IconComponent}
              boxSize={`${size}px`} // Применяем размер
              color={starColor}      // Применяем цвет
            />
          </Box>
        );
      })}
    </HStack>
  );
}

export default ChakraRating;