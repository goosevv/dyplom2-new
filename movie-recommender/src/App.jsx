// movie-recommender/src/App.jsx
import React, { useContext } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import NavBar from "./components/NavBar";

// Страницы
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Recommendations from "./pages/Recommendations";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import MyListsPage from "./pages/MyListsPage";
import ListPage from "./pages/ListPage";
import ContentManagerPage from "./pages/ContentManagerPage";
import AdminPage from "./pages/AdminPage";

// Компонент ProtectedRoute с проверкой роли
function ProtectedRoute({ user, allowed }) {
  // если не залогинен — на логин
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // если роль пользователя не входит в allowed — на /recommendations
  if (!allowed.includes(user.role)) {
    return <Navigate to="/recommendations" replace />;
  }
  // всё ок — рендерим дочерние <Route> через <Outlet>
  return <Outlet />;
}

export default function App() {
  const { user } = useContext(AuthContext);

  return (
    <>
      <NavBar />
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 1. Доступ всем залогиненным (user, content_manager, admin) */}
        <Route
          element={
            <ProtectedRoute
              user={user}
              allowed={["user", "content_manager", "admin"]}
            />
          }>
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/mylists" element={<MyListsPage />} />
          <Route path="/list/:listId" element={<ListPage />} />
        </Route>

        {/* 2. Доступ только content_manager и admin */}
        <Route
          element={
            <ProtectedRoute
              user={user}
              allowed={["content_manager", "admin"]}
            />
          }>
          <Route path="/content-manager" element={<ContentManagerPage />} />
        </Route>

        {/* 3. Доступ только admin */}
        <Route element={<ProtectedRoute user={user} allowed={["admin"]} />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
