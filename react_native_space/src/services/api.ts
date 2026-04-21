import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use environment variable for API URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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

// Helper to remove storage item
const removeStorageItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
};

class ApiService {
  private api: AxiosInstance;
  private tokenRefreshPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await getStorageItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        const requestUrl = originalRequest?.url ?? '';
        
        // Don't try to refresh token for auth endpoints (login, register, etc.)
        const isAuthEndpoint = requestUrl.includes('/auth/login') || 
                               requestUrl.includes('/auth/register') ||
                               requestUrl.includes('/auth/refresh') ||
                               requestUrl.includes('/auth/google') ||
                               requestUrl.includes('/auth/apple');

        if (error?.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            const newToken = await this.refreshAccessToken();
            if (newToken && originalRequest?.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, clear tokens and reject
            await this.clearTokens();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = (async () => {
      try {
        const refreshToken = await getStorageItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { access_token } = response?.data ?? {};
        if (access_token) {
          await setStorageItem('access_token', access_token);
          return access_token;
        }

        throw new Error('Failed to refresh token');
      } finally {
        this.tokenRefreshPromise = null;
      }
    })();

    return this.tokenRefreshPromise;
  }

  private async clearTokens(): Promise<void> {
    await removeStorageItem('access_token');
    await removeStorageItem('refresh_token');
    await removeStorageItem('user');
  }

  getAxiosInstance(): AxiosInstance {
    return this.api;
  }

  // Get the current auth token
  async getAuthToken(): Promise<string | null> {
    return await getStorageItem('access_token');
  }

  // Helper method to handle API errors
  handleError(error: any): string {
    if (axios.isAxiosError(error)) {
      const message = error?.response?.data?.message;
      if (Array.isArray(message)) {
        return message?.[0] ?? 'An error occurred';
      }
      return message ?? error?.message ?? 'Network error';
    }
    return error?.message ?? 'An unexpected error occurred';
  }
}

export default new ApiService();
