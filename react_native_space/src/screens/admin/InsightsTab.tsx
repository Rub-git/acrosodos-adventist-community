import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import { useLocalization } from '../../contexts/LocalizationContext';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Insights {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalPosts: number;
  totalComments: number;
  totalReactions: number;
  pendingFlags: number;
  newUsersLastWeek: number;
  newPostsLastWeek: number;
}

interface InsightsTabProps {
  refreshTrigger: boolean;
}

const InsightsTab: React.FC<InsightsTabProps> = ({ refreshTrigger }) => {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insights | null>(null);

  useEffect(() => {
    fetchInsights();
  }, [refreshTrigger]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAxiosInstance().get<Insights>('/admin/insights');
      setInsights(response?.data ?? null);
    } catch (error) {
      Alert.alert(t('common.error'), apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!insights) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="bodyLarge">{t('common.error')}</Text>
      </View>
    );
  }

  const StatCard = ({ title, value, icon, color = '#6200ea' }: { title: string; value: number; icon: string; color?: string }) => (
    <Card style={styles.statCard}>
      <Card.Content style={styles.statContent}>
        <View style={styles.statHeader}>
          <Text variant="titleLarge" style={[styles.statIcon, { color }]}>
            {icon}
          </Text>
        </View>
        <Text variant="displaySmall" style={[styles.statValue, { color }]}>
          {value?.toLocaleString() ?? 0}
        </Text>
        <Text variant="bodyMedium" style={styles.statTitle}>
          {title}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Users Section */}
      <Text variant="titleLarge" style={styles.sectionTitle}>
        👥 {t('admin.users')}
      </Text>
      <View style={styles.statsRow} key="users-row-1">
        <StatCard
          key="stat-total-users"
          title={t('admin.totalUsers')}
          value={insights?.totalUsers ?? 0}
          icon="👥"
          color="#1976d2"
        />
        <StatCard
          key="stat-active-users"
          title={t('admin.activeUsers')}
          value={insights?.activeUsers ?? 0}
          icon="✅"
          color="#388e3c"
        />
      </View>
      <View style={styles.statsRow} key="users-row-2">
        <StatCard
          key="stat-suspended-users"
          title={t('admin.suspendedUsers')}
          value={insights?.suspendedUsers ?? 0}
          icon="🚫"
          color="#d32f2f"
        />
        <StatCard
          key="stat-new-users"
          title={t('admin.newUsersLastWeek')}
          value={insights?.newUsersLastWeek ?? 0}
          icon="🆕"
          color="#00897b"
        />
      </View>

      <Divider style={styles.divider} />

      {/* Content Section */}
      <Text variant="titleLarge" style={styles.sectionTitle}>
        📝 {t('common.content')}
      </Text>
      <View style={styles.statsRow} key="content-row-1">
        <StatCard
          key="stat-total-posts"
          title={t('admin.totalPosts')}
          value={insights?.totalPosts ?? 0}
          icon="📝"
          color="#5e35b1"
        />
        <StatCard
          key="stat-new-posts"
          title={t('admin.newPostsLastWeek')}
          value={insights?.newPostsLastWeek ?? 0}
          icon="✨"
          color="#00acc1"
        />
      </View>
      <View style={styles.statsRow} key="content-row-2">
        <StatCard
          key="stat-total-comments"
          title={t('admin.totalComments')}
          value={insights?.totalComments ?? 0}
          icon="💬"
          color="#fb8c00"
        />
        <StatCard
          key="stat-total-reactions"
          title={t('admin.totalReactions')}
          value={insights?.totalReactions ?? 0}
          icon="❤️"
          color="#e91e63"
        />
      </View>

      <Divider style={styles.divider} />

      {/* Moderation Section */}
      <Text variant="titleLarge" style={styles.sectionTitle}>
        🛡️ {t('moderation.title')}
      </Text>
      <View style={styles.statsRow} key="moderation-row-1">
        <StatCard
          key="stat-pending-flags"
          title={t('admin.pendingFlags')}
          value={insights?.pendingFlags ?? 0}
          icon="⚠️"
          color={insights?.pendingFlags ?? 0 > 0 ? '#f57c00' : '#388e3c'}
        />
        <View style={styles.statCard} key="empty-placeholder" />
      </View>

      {/* About Section */}
      <Divider style={styles.divider} />
      <Card style={styles.aboutCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.aboutTitle}>
            📱 {t('admin.about')}
          </Text>
          <View style={styles.aboutRow}>
            <Text variant="bodyMedium" style={styles.aboutLabel}>
              {t('admin.company')}:
            </Text>
            <Text variant="bodyMedium" style={styles.aboutValue}>
              Prospectos Digitales LLC
            </Text>
          </View>
          <View style={styles.aboutRow}>
            <Text variant="bodyMedium" style={styles.aboutLabel}>
              {t('admin.appCreator')}:
            </Text>
            <Text variant="bodyMedium" style={styles.aboutValue}>
              Rubisel Ramirez
            </Text>
          </View>
          <View style={styles.aboutRow}>
            <Text variant="bodyMedium" style={styles.aboutLabel}>
              {t('admin.support')}:
            </Text>
            <Text variant="bodyMedium" style={[styles.aboutValue, styles.emailText]}>
              soporte@prospectosdigitales.com
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingTop: 28,
  },
  statHeader: {
    marginBottom: 8,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    lineHeight: 36,
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  divider: {
    marginVertical: 24,
  },
  aboutCard: {
    marginTop: 16,
    marginBottom: 32,
    elevation: 2,
    backgroundColor: '#f8f9fa',
  },
  aboutTitle: {
    fontWeight: '600',
    marginBottom: 16,
    color: '#6200ea',
  },
  aboutRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  aboutLabel: {
    fontWeight: '600',
    marginRight: 8,
    color: '#333',
  },
  aboutValue: {
    color: '#666',
    flex: 1,
  },
  emailText: {
    color: '#1976d2',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default InsightsTab;
