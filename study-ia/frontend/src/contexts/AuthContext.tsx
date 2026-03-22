'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  grado?: string;
  area?: string;
  areaLabel?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateLocalUser: (data: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  studyMethod?: string;
  level?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userGrado');
    localStorage.removeItem('userArea');
    localStorage.removeItem('onboardingComplete');
    localStorage.removeItem('onboardingData');
    localStorage.removeItem('isGuest');
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken || storedToken === 'undefined' || storedToken === 'null' || storedToken === '') {
      clearAuth();
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (!response.ok) {
        // No hacer logout automático, solo mantener el token local
        setToken(storedToken);
        setUser({
          id: localStorage.getItem('userId') || 'local',
          email: localStorage.getItem('userEmail') || '',
          name: localStorage.getItem('userName') || 'Usuario',
          grado: localStorage.getItem('userGrado') || '',
          area: localStorage.getItem('userArea') || '',
        });
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.success && data.data?.user) {
        setUser({
          id: data.data.user.id,
          email: data.data.user.email,
          name: data.data.user.name || localStorage.getItem('userName') || 'Usuario',
          grado: data.data.user.grado || localStorage.getItem('userGrado') || '',
          area: data.data.user.area || localStorage.getItem('userArea') || '',
        });
        setToken(storedToken);
      } else {
        // Mantener sesión local si la verificación falla
        setToken(storedToken);
        setUser({
          id: localStorage.getItem('userId') || 'local',
          email: localStorage.getItem('userEmail') || '',
          name: localStorage.getItem('userName') || 'Usuario',
          grado: localStorage.getItem('userGrado') || '',
          area: localStorage.getItem('userArea') || '',
        });
      }
    } catch {
      // Mantener sesión local si hay error de red
      setToken(storedToken);
      setUser({
        id: localStorage.getItem('userId') || 'local',
        email: localStorage.getItem('userEmail') || '',
        name: localStorage.getItem('userName') || 'Usuario',
        grado: localStorage.getItem('userGrado') || '',
        area: localStorage.getItem('userArea') || '',
      });
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, clearAuth]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
        localStorage.setItem('token', data.data.token);
        setToken(data.data.token);
        
        if (data.data.user) {
          setUser({
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.name || 'Usuario',
            grado: data.data.user.grado,
            area: data.data.user.area,
          });
        }
        
        return { success: true };
      }

      return { success: false, error: data.error || 'Credenciales inválidas' };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  }, [API_URL]);

  const register = useCallback(async (registerData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('userName', registerData.name);
        localStorage.setItem('onboardingComplete', 'true');
        
        setToken(data.data.token);
        
        if (data.data.user) {
          setUser({
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.name || registerData.name,
          });
        }
        
        return { success: true };
      }

      return { success: false, error: data.error || 'Error al registrar' };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  }, [API_URL]);

  const logout = useCallback(() => {
    clearAuth();
    router.push('/');
  }, [clearAuth, router]);

  const updateLocalUser = useCallback((data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
    if (data.name) localStorage.setItem('userName', data.name);
    if (data.grado) localStorage.setItem('userGrado', data.grado);
    if (data.area) localStorage.setItem('userArea', data.area);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshUser,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export function useRequireAuth(redirectTo: string = '/') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { isLoading, isAuthenticated };
}
