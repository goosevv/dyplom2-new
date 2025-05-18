// src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export function ProtectedRoute({ allowed }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    // не залогинен
    return <Navigate to="/login" replace />;
  }
  if (!allowed.includes(user.role)) {
    // недостаточно прав
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
