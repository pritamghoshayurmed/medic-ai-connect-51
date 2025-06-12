import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from '../pages/auth/SplashScreen';
import Login from '../pages/auth/Login';
import SignUp from '../pages/auth/SignUp';
import ForgotPassword from '../pages/auth/ForgotPassword';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {/* Add other routes here */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes; 