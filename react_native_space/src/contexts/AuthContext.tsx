import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User, AuthResponse, LoginDto, RegisterDto } from '../types';
import apiService from '../services/api';

// Helper to get storage item (use localStorage on web for reliability)
const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return AsyncStorage.getItem(key);
};

// Helper to set storage item
const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
};

// Helper to remove storage items
const removeStorageItems = async (keys: string[]): Promise<void> => {
  if (Platform.OS === 'web') {
    keys.forEach(key => localStorage.removeItem(key));
  } else {
    await AsyncStorage.multiRemove(keys);
  }
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  googleAuth: (idToken: string) => Promise<void>;
  appleAuth: (identityToken: string) => Promise<void>;
  acceptValues: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await getStorageItem('user');
      const token = await getStorageItem('access_token');
      
      console.log('[AuthContext] loadUser: Checking storage - hasUser:', !!userData, 'hasToken:', !!token);
      
      if (userData && token) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('[AuthContext] loadUser: ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAuthData = async (authResponse: AuthResponse) => {
    try {
      console.log('[AuthContext] saveAuthData: Received auth response:', {
        hasAccessToken: !!authResponse?.access_token,
        hasRefreshToken: !!authResponse?.refresh_token,
        hasUser: !!authResponse?.user,
      });
      
      await setStorageItem('access_token', authResponse?.access_token ?? '');
      await setStorageItem('refresh_token', authResponse?.refresh_token ?? '');
      await setStorageItem('user', JSON.stringify(authResponse?.user ?? {}));
      
      console.log('[AuthContext] saveAuthData: Tokens saved successfully using', Platform.OS === 'web' ? 'localStorage' : 'AsyncStorage');
      
      // Verify tokens were saved
      const savedAccessToken = await getStorageItem('access_token');
      const savedRefreshToken = await getStorageItem('refresh_token');
      console.log('[AuthContext] saveAuthData: Verification - tokens in storage:', {
        hasAccessToken: !!savedAccessToken,
        hasRefreshToken: !!savedRefreshToken,
        accessTokenPreview: savedAccessToken ? savedAccessToken.substring(0, 20) + '...' : 'none',
      });
      
      setUser(authResponse?.user ?? null);
    } catch (error) {
      console.error('[AuthContext] saveAuthData: ERROR:', error);
      throw error;
    }
  };

  const login = async (credentials: LoginDto) => {
    try {
      const response = await apiService.getAxiosInstance().post<AuthResponse>('/auth/login', credentials);
      await saveAuthData(response?.data ?? {} as AuthResponse);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterDto) => {
    try {
      const response = await apiService.getAxiosInstance().post<AuthResponse>('/auth/register', data);
      await saveAuthData(response?.data ?? {} as AuthResponse);
    } catch (error) {
      throw error;
    }
  };

  const googleAuth = async (idToken: string) => {
    try {
      const response = await apiService.getAxiosInstance().post<AuthResponse>('/auth/google', { idToken });
      await saveAuthData(response?.data ?? {} as AuthResponse);
    } catch (error) {
      throw error;
    }
  };

  const appleAuth = async (identityToken: string) => {
    try {
      const response = await apiService.getAxiosInstance().post<AuthResponse>('/auth/apple', { identityToken });
      await saveAuthData(response?.data ?? {} as AuthResponse);
    } catch (error) {
      throw error;
    }
  };

  const acceptValues = async () => {
    try {
      console.log('[AuthContext] acceptValues: Calling /auth/accept-values');
      const response = await apiService.getAxiosInstance().post('/auth/accept-values');
      console.log('[AuthContext] acceptValues: API call success, response:', response?.data);
      console.log('[AuthContext] acceptValues: Refreshing user data...');
      await refreshUser();
      console.log('[AuthContext] acceptValues: Complete!');
    } catch (error: any) {
      console.error('[AuthContext] acceptValues: ERROR:', error?.response?.data || error?.message || error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      console.log('[AuthContext] refreshUser: Calling /auth/me');
      const response = await apiService.getAxiosInstance().get<User>('/auth/me');
      const userData = response?.data ?? null;
      console.log('[AuthContext] refreshUser: Got user data, hasAcceptedValues:', userData?.hasAcceptedValues);
      if (userData) {
        await setStorageItem('user', JSON.stringify(userData));
        setUser(userData);
        console.log('[AuthContext] refreshUser: User state updated');
      }
    } catch (error: any) {
      console.error('[AuthContext] refreshUser: ERROR:', error?.response?.data || error?.message || error);
    }
  };

  const logout = async () => {
    try {
      await removeStorageItems(['access_token', 'refresh_token', 'user']);
      setUser(null);
      console.log('[AuthContext] logout: User logged out, storage cleared');
    } catch (error) {
      console.error('[AuthContext] logout: ERROR:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        googleAuth,
        appleAuth,
        acceptValues,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
