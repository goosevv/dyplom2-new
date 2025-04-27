import React, { useState } from "react";
import { Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import { Box } from "@chakra-ui/react";

import { LocaleContext } from "./LocaleContext";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Recommendations from "./pages/Recommendations";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  // 1) состояние текущего языка для TMDb
  const [tmdbLang, setTmdbLang] = useState("uk-UA");
  // 2) для условного паддинга
  const { pathname } = useLocation();
  const paddingTop = pathname === "/" ? 0 : "80px";

  return (
    <LocaleContext.Provider value={{ tmdbLang, setTmdbLang }}>
      <NavBar />
      <Box pt={paddingTop}>
        <Routes>
          {/* публичные */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* приватные */}
          <Route element={<ProtectedRoute />}>
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* редирект всех прочих на главную */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </LocaleContext.Provider>
  );
}
function ProtectedRoute() {
  const token = localStorage.getItem('token')
  return token
    ? <Outlet />
    : <Navigate to="/login" replace />
}