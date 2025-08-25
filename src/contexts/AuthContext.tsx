'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  const checkAuthStatus = useCallback(async () => {
  try {
    if (apiClient.isAuthenticated()) {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        
        // Only redirect if NOT already on tenant dashboard
        const token = apiClient.getAuthToken();
        if (token && window.location.pathname !== '/tenant-dashboard') {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role === 'tenant') {
              router.push('/tenant-dashboard');
              return;
            }
          } catch {}
        }
      } else {
        apiClient.logout();
      }
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    apiClient.logout();
  } finally {
    setLoading(false);
  }
}, [router]);

useEffect(() => {
  checkAuthStatus();
}, [checkAuthStatus]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error || 'Login failed' 
        };
      }
    } catch {
      return { 
        success: false, 
        error: 'Network error occurred' 
      };
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    router.push('/login');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}