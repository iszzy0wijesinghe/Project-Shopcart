import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/custApi'

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/custAuth/customer');
      console.log('User data:', response.data.data.customer)
      setCurrentUser(response.data.data.customer); // Adjust based on actual response (e.g., data.customer)
      localStorage.setItem('user', JSON.stringify(response.data.data.customer));
    } catch (error) {
      console.error('Error fetching user:', error);
      setCurrentUser(null);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is logged in on mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Function to handle user login
  const login = async (email, password) => {
    // setIsLoading(true);
    try {
      const logForm = { email, password };
      const response = await api.post('/api/custAuth/customer-login', logForm);

      // const user = response.data.data.customer;
      // setCurrentUser(user);
      // localStorage.setItem('user', JSON.stringify(user));
      fetchUser();
      console.log(currentUser)
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Function to handle user registration
  const register = async (formData) => {
    try {
      const response = await api.post('/api/custAuth/customer-register', formData);
      
      fetchUser();
      console.log(currentUser)
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const googleLogin = async (credential) => {
    try {
      const response = await api.post('/api/custAuth/google', { credential });

      fetchUser();
      console.log(currentUser)
      return response;
    } catch (error) {
      console.error('Google Auth error:', error);
        throw error;
    }
};

  // // Function to handle user logout
  const logout = async () => {
    try {
      const response = await api.post('/api/custAuth/secure/customer-logout');
      localStorage.removeItem('user');
      setCurrentUser(null);
      fetchUser();
      return response;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // // Function to update user profile
  // const updateProfile = async (updatedData) => {
  //   try {
  //     const response = await fetch('/api/users/profile', {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify(updatedData),
  //     });
      
  //     const data = await response.json();
      
  //     if (!response.ok) {
  //       throw new Error(data.message || 'Update failed');
  //     }
      
  //     const updatedUser = { ...currentUser, ...data.user };
  //     localStorage.setItem('user', JSON.stringify(updatedUser));
  //     setCurrentUser(updatedUser);
      
  //     return updatedUser;
  //   } catch (error) {
  //     console.error('Profile update error:', error);
  //     throw error;
  //   }
  // };

  const value = {
    currentUser,
    isLoading,
    login,
    register,
    logout,
    googleLogin,
    // updateProfile,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

