import React from 'react';
import { auth } from '../utils/auth';

const DebugAuth = () => {
  const checkAuth = () => {
    console.log('=== DEBUG AUTH ===');
    console.log('Access Token:', auth.getAccessToken());
    console.log('Refresh Token:', auth.getRefreshToken());
    console.log('User Role:', auth.getUserRole());
    console.log('User Email:', auth.getUserEmail());
    console.log('Is Authenticated:', auth.isAuthenticated());
    console.log('LocalStorage keys:', Object.keys(localStorage));
    console.log('=== END DEBUG ===');
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      zIndex: 9999,
      background: '#ff0000',
      color: 'white',
      padding: '5px 10px',
      borderRadius: '5px',
      cursor: 'pointer'
    }} onClick={checkAuth}>
      DEBUG AUTH
    </div>
  );
};

export default DebugAuth;
