import React from 'react';
import { useLocation } from 'react-router-dom';
import Login from './Login';
import Register from './Register';

const LoginRegister = () => {
  const location = useLocation();
  const isRegisterPage = location.pathname === '/register';

  return (
    <div>
      {isRegisterPage ? <Register /> : <Login />}
    </div>
  );
};

export default LoginRegister;
