// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import axios from "axios";
// Убираем ChakraProvider и extendTheme отсюда, они теперь только в main.jsx
import { Box, Spinner, Center } from "@chakra-ui/react";

// --- Импорт ваших страниц и компонентов ---
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Recommendations from "./pages/Recommendations";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import MyListsPage from "./pages/MyListsPage";
import ListPage from "./pages/ListPage";
import PublicListPage from "./pages/PublicListPage";
import { LocaleContext } from "./LocaleContext";
import ContentManagerPage from "./pages/ContentManagerPage";
import AdminPage from "./pages/AdminPage";

// Компонент ProtectedRoute
// Компонент ProtectedRoute: проверяет и авторизацию, и роль
function ProtectedRoute({ user, allowed }) {
  // если вообще не залогинен
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // если роль не входит в список allowed
  if (!allowed.includes(user.role)) {
    // можно редиректить на главную или recommendations
    return <Navigate to="/recommendations" replace />;
  }
  // всё ок — рендерим вложенные маршруты
  return <Outlet />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Убедитесь, что 'uk' является валидным начальным значением для LocaleContext
  // Возможно, стоит использовать 'uk-UA', если вы используете его в LanguageSwitcher
  const [tmdbLang, setTmdbLang] = useState("uk-UA"); // Используем uk-UA как в Switcher

  const handleLogout = useCallback(() => {
    // console.log("Logging out from App..."); // Можно убрать console.log
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_id");
    setUser(null);
  }, []);

  const handleLoginSuccess = useCallback((userData, token) => {
    // console.log("Login success in App, updating user state:", userData); // Можно убрать console.log
    localStorage.setItem("token", token);
    localStorage.setItem("user_id", userData.id);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []); // Пустой массив зависимостей здесь корректен

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("token");
      // console.log("App Mount: Checking auth status, token:", token); // Можно убрать

      if (!token) {
        setUser(null);
        setIsLoading(false);
        // console.log("App Mount: No token found."); // Можно убрать
        return;
      }

      try {
        const response = await axios.get("/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // console.log("App Mount: Token valid, user data:", response.data); // Можно убрать
        handleLoginSuccess(response.data, token);
      } catch (error) {
        console.error(
          "App Mount: Token validation failed:",
          error.response?.data || error.message
        );
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
    // Зависимости useEffect остаются прежними
  }, [handleLogout, handleLoginSuccess]);

  if (isLoading) {
    // Не нужен ChakraProvider здесь, он есть в main.jsx
    return (
      <Center h="100vh" bg="brand.purple">
        {" "}
        {/* Можно задать фон для лоадера */}
        <Spinner size="xl" color="brand.gold" />{" "}
        {/* Спиннер можно сделать золотым */}
      </Center>
    );
  }

  // Основной рендеринг приложения
  return (
    // !!! УБИРАЕМ ChakraProvider ОТСЮДА !!!
    <LocaleContext.Provider value={{ tmdbLang, setTmdbLang }}>
      {/* NavBar теперь стилизуется сам */}
      <NavBar user={user} onLogout={handleLogout} />

      {/*
          Этот Box больше не нужен для задания основного фона, если вы используете
          глобальные стили в theme.js. Если не используете глобальные стили,
          оставьте Box и задайте ему bg="brand.purple", color="whiteAlpha.900".
          Отступ pt нужен в любом случае, чтобы контент не уехал под хедер.
        */}
      <Box pt={{ base: "60px", md: "70px" }}>
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/recommendations" replace />
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
              )
            }
          />
          <Route
            path="/register"
            element={
              user ? <Navigate to="/recommendations" replace /> : <Register />
            }
          />
          <Route path="/public/list/:listId" element={<PublicListPage />} />

          {/* Приватные маршруты */}
          <Route
            element={
              <ProtectedRoute
                user={user}
                allowed={["content_manager", "admin"]}
              />
            }>
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route
              path="/profile"
              element={<Profile user={user} onLogout={handleLogout} />}
            />
            <Route path="/mylists" element={<MyListsPage />} />
            <Route path="/list/:listId" element={<ListPage />} />
          </Route>
          {/* Панель контент-менеджера */}
          <Route
            element={<ProtectedRoute allowed={["content_manager", "admin"]} />}>
            <Route path="/content-manager" element={<ContentManagerPage />} />
          </Route>
          {/* Панель адміністратора */}
          <Route element={<ProtectedRoute user={user} allowed={["admin"]} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          {/* Маршрут по умолчанию */}
          <Route
            path="*"
            element={<Navigate to={user ? "/recommendations" : "/"} replace />}
          />
        </Routes>
      </Box>
    </LocaleContext.Provider>
    // !!! КОНЕЦ УДАЛЕННОГО ChakraProvider !!!
  );
}
