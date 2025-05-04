// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // Убедитесь, что путь к App правильный
import { BrowserRouter } from "react-router-dom";
// 1. Импортируем ChakraProvider и extendTheme из Chakra UI
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

// 2. Определяем конфигурацию темы для темного режима по умолчанию
const config = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

// 3. Создаем объект темы с нашей конфигурацией
// Убедитесь, что это ЕДИНСТВЕННОЕ место, где объявляется 'theme'
const theme = extendTheme({ config });

// 4. Находим корневой элемент
const rootElement = document.getElementById("root");

// 5. Рендерим приложение
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/* 6. Передаем созданную тему в ChakraProvider */}
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);
