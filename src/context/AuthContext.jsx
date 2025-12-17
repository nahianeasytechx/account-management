// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('ledgerUsers');
    return saved ? JSON.parse(saved) : [
      {
        id: 'demo-user',
        username: 'demo@example.com',
        email: 'demo@example.com',
        name: 'Demo User',
        password: 'demo123',
        createdAt: new Date().toISOString()
      }
    ];
  });

  // Save users to localStorage
  useEffect(() => {
    localStorage.setItem('ledgerUsers', JSON.stringify(users));
  }, [users]);

  // Save current user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const login = (username, password) => {
    try {
      // Check demo user
      if (username === 'demo@example.com' && password === 'demo123') {
        const demoUser = {
          id: 'demo-user',
          username: 'demo@example.com',
          email: 'demo@example.com',
          name: 'Demo User'
        };
        setCurrentUser(demoUser);
        return { success: true, message: 'Login successful' };
      }

      // Check registered users
      const user = users.find(
        u => (u.username === username || u.email === username) && 
        u.password === password
      );

      if (user) {
        const { password, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
        return { success: true, message: 'Login successful' };
      }

      return { success: false, message: 'Invalid credentials' };
    } catch (error) {
      return { success: false, message: 'Login failed' };
    }
  };

  const register = (userData) => {
    try {
      // Check if user already exists
      const existingUser = users.find(
        u => u.email === userData.email || u.username === userData.username
      );

      if (existingUser) {
        return { success: false, message: 'User already exists' };
      }

      const newUser = {
        id: `user-${Date.now()}`,
        ...userData,
        createdAt: new Date().toISOString()
      };

      setUsers([...users, newUser]);
      
      const { password, ...userWithoutPassword } = newUser;
      setCurrentUser(userWithoutPassword);
      
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      return { success: false, message: 'Registration failed' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    return { success: true, message: 'Logged out successfully' };
  };

  const updateUser = (updatedData) => {
    if (!currentUser) return { success: false, message: 'No user logged in' };
    
    try {
      const updatedUsers = users.map(u => 
        u.id === currentUser.id ? { ...u, ...updatedData } : u
      );
      setUsers(updatedUsers);
      
      const updatedUser = { ...currentUser, ...updatedData };
      setCurrentUser(updatedUser);
      
      return { success: true, message: 'Profile updated' };
    } catch (error) {
      return { success: false, message: 'Update failed' };
    }
  };

  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated,
      login,
      register,
      logout,
      updateUser,
      users
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};