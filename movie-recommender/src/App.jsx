import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Recommendations from './pages/Recommendations';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Lists from './pages/Lists';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container">
          <Link className="navbar-brand" to="/">MovieReco</Link>
          <div>
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/recommendations">Рекомендації</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/lists">Списки</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/profile">Профіль</Link>
              </li>
            </ul>
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link className="nav-link" to="/login">Вхід</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/register">Реєстрація</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/lists" element={<Lists />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}
