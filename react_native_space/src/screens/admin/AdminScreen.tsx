import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Appbar, SegmentedButtons, Surface, Text, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import UsersTab from './UsersTab';
import InsightsTab from './InsightsTab';

type TabValue = 'users' | 'insights';

const AdminScreen: React.FC = () => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>('users');
  const [refreshing, setRefreshing] = useState(false);

  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Appbar.Header>
          <Appbar.Content title={t('admin.title')} />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge">{t('common.error')}: Access Denied</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleRefresh = () => {
    setRefreshing(true);
    // Refresh will be handled by child components
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.Content title={t('admin.title')} />
      </Appbar.Header>

      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
          buttons={[
            {
              value: 'users',
              label: t('admin.users'),
              icon: 'account-group',
            },
            {
              value: 'insights',
              label: t('admin.insights'),
              icon: 'chart-bar',
            },
          ]}
        />
      </View>

      <View style={styles.content}>
        {activeTab === 'users' && <UsersTab refreshTrigger={refreshing} />}
        {activeTab === 'insights' && <InsightsTab refreshTrigger={refreshing} />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default AdminScreen;
