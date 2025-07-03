// src/pages/AdminLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './adminSupplier.css';
import logo from '../assets/logo.png';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin1234') {
      navigate('/adminSuppliers');
    } else {
      setError('Invalid credentials. Try admin / admin');
    }
  };

  return (
    <div className="admin-login-container-supplier">

      <div className="login-box-supplier">
      <img src={logo} alt="GOCART Logo" className="admin-logo-supplier" />

        <h2 className='h2-login-supplier'>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className='login-input-supplier'
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className='login-input-supplier'
          />
          {error && <p className="error-admin-login">{error}</p>}
          <button type="submit" className='submit-login-supplier'>Login</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
