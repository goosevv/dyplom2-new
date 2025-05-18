// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
// 1. Импортируем ТОЛЬКО ChakraProvider
import { ChakraProvider } from "@chakra-ui/react";
// 2. Импортируем НАШУ тему из theme.js
import theme from "./theme"; // <-- Убедитесь, что путь правильный
import { AuthProvider } from "./context/AuthContext";

const rootElement = document.getElementById("root");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/* 3. Оборачиваем приложение ОДИН РАЗ в ChakraProvider и передаем НАШУ тему */}
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  </React.StrictMode>
);
