import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock axios
jest.mock('axios');

const TestComponent = () => {
  const { user, loading } = useAuth();
  return null;
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalled();
    });
  });

  it('should load user from AsyncStorage', async () => {
    const mockUser = JSON.stringify({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    });

    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'user') return Promise.resolve(mockUser);
      if (key === 'access_token') return Promise.resolve('fake-token');
      return Promise.resolve(null);
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('user');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('access_token');
    });
  });
});
