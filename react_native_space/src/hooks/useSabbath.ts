import { useState, useEffect } from 'react';
import { SabbathStatus } from '../types';
import apiService from '../services/api';
import * as Location from 'expo-location';

export const useSabbath = () => {
  const [sabbathStatus, setSabbathStatus] = useState<SabbathStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSabbathStatus();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSabbathStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchSabbathStatus = async () => {
    try {
      // Get user's timezone
      const { status } = await Location.requestForegroundPermissionsAsync();
      let timezone = 'America/New_York'; // Default
      
      if (status === 'granted') {
        timezone = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone ?? timezone;
      }

      const response = await apiService.getAxiosInstance().get<SabbathStatus>('/sabbath/status', {
        params: { timezone },
      });
      
      setSabbathStatus(response?.data ?? null);
    } catch (error) {
      console.error('Error fetching Sabbath status:', error);
    } finally {
      setLoading(false);
    }
  };

  return { sabbathStatus, loading, refetch: fetchSabbathStatus };
};
