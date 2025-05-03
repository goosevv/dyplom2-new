// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { ChakraProvider, Box, Spinner, Center, extendTheme } from '@chakra-ui/react'; // Убедитесь, что все импорты есть

// --- Импорт ваших страниц и компонентов ---
import NavBar from './components/NavBar'; // Правильное имя NavBar
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Recommendations from './pages/Recommendations';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
// import MovieDetails from './pages/MovieDetails';
// import NotFound from './pages/NotFound';
import { LocaleContext } from './LocaleContext'; // Импорт контекста

// Ваш компонент ProtectedRoute (перемещен внутрь или импортирован)
function ProtectedRoute({ user }) {
  console.log("ProtectedRoute checking user prop:", user);
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

// function App() { // Убедитесь, что это экспорт по умолчанию
export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tmdbLang, setTmdbLang] = useState('uk'); // Пример из вашего старого кода

  // --- Функция для выхода пользователя ---
  const handleLogout = useCallback(() => {
    console.log("Logging out from App...");
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    setUser(null);
  }, []);

  // --- Функция для обработки успешного входа ---
  // Будет вызвана из Login.jsx
  const handleLoginSuccess = useCallback((userData, token) => {
    console.log("Login success in App, updating user state:", userData);
    // 1. Сохраняем в localStorage (дублируем для надежности)
    localStorage.setItem("token", token);
    localStorage.setItem("user_id", userData.id);
    localStorage.setItem("user", JSON.stringify(userData));
    // 2. Устанавливаем состояние в App НЕМЕДЛЕННО
    setUser(userData);
  }, []); // Нет зависимостей, т.к. использует только аргументы и setUser

  // --- useEffect для проверки токена при загрузке ---
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      console.log("App Mount: Checking auth status, token:", token);

      if (!token) {
        setUser(null);
        setIsLoading(false);
        console.log("App Mount: No token found.");
        return;
      }

      try {
        const response = await axios.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("App Mount: Token valid, user data:", response.data);
        // Вызываем handleLoginSuccess для консистентности установки состояния и localStorage
        handleLoginSuccess(response.data, token);
      } catch (error) {
        console.error("App Mount: Token validation failed:", error.response?.data || error.message);
        handleLogout(); // Токен невалиден - выходим
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [handleLogout, handleLoginSuccess]); // Добавили handleLoginSuccess в зависимости

  // --- Расчет paddingTop (из вашего кода) ---
  // const location = useLocation(); - нужно импортировать useLocation
  // const paddingTop = location.pathname === '/' ? 0 : { base: "60px", md: "70px" };
  // !!! ВАЖНО: Хуки (useLocation) нельзя вызывать после условного return (isLoading)
  // Лучше вынести расчет paddingTop внутрь return или использовать CSS

  // --- Отображение индикатора загрузки ---
  if (isLoading) {
    return (
      <ChakraProvider> {/* Убедитесь, что провайдер есть */}
        <Center h="100vh">
          <Spinner size="xl" />
        </Center>
      </ChakraProvider>
    );
  }

  // --- Основной рендеринг приложения ---
  return (
    <ChakraProvider> {/* Убедитесь, что провайдер есть */}
      <LocaleContext.Provider value={{ tmdbLang, setTmdbLang }}>
        {/* Оборачиваем в Router */}

          {/* Передаем user и onLogout в NavBar */}
          <NavBar user={user} onLogout={handleLogout} />

          {/* Задаем paddingTop через стили Box */}
          {/* Можно добавить условие, если он не нужен на главной */}
          <Box pt={{ base: "60px", md: "70px" }}> {/* Применяем отступ всегда для простоты */}
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/" element={<Home />} />

              {/* Логин: передаем onLoginSuccess */}
              <Route
                path="/login"
                element={user ? <Navigate to="/recommendations" replace /> : <Login onLoginSuccess={handleLoginSuccess} />}
              />
              {/* Регистрация */}
              <Route
                path="/register"
                element={user ? <Navigate to="/recommendations" replace /> : <Register />}
              />

              {/* Приватные маршруты */}
              <Route element={<ProtectedRoute user={user} />}>
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/favorites" element={<Favorites />} />
                {/* Profile: передаем user и onLogout */}
                <Route path="/profile" element={<Profile user={user} onLogout={handleLogout} />} />
                {/* Другие приватные роуты */}
                 {/* <Route path="/movie/:id" element={<MovieDetails />} /> */}
                 {/* <Route path="/lists" element={<Lists />} /> */}
              </Route>

              {/* Маршрут по умолчанию */}
              <Route path="*" element={<Navigate to={user ? "/recommendations" : "/"} replace />} />
            </Routes>
          </Box>
      </LocaleContext.Provider>
    </ChakraProvider>
  );
}

// Экспорт по умолчанию, если его не было
// export default App;