import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Appbar, Card, Text, Chip, Divider, List, Avatar } from 'react-native-paper';
import { useLocalization } from '../../contexts/LocalizationContext';
import { formatTimestamp } from '../../utils/formatters';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isactive: boolean;
  suspensionreason?: string;
  suspendedat?: string;
  suspendedby?: string;
  localchurch?: string;
  ministry?: string;
  country?: string;
  preferredlanguage?: string;
  timezone?: string;
  createdat: string;
  lastloginat?: string;
  profilepictureurl?: string;
  _count?: {
    posts: number;
    comments: number;
    reactions: number;
    flagsreported: number;
  };
  recentPosts?: Array<{
    id: string;
    contenttype: string;
    textcontent?: string;
    createdat: string;
    _count: {
      reactions: number;
      comments: number;
    };
  }>;
}

interface UserDetailsModalProps {
  visible: boolean;
  user: User;
  onDismiss: () => void;
  onRefresh: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ visible, user, onDismiss }) => {
  const { t } = useLocalization();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '#d32f2f';
      case 'MODERATOR':
        return '#f57c00';
      default:
        return '#6200ea';
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <Appbar.Header>
          <Appbar.BackAction onPress={onDismiss} />
          <Appbar.Content title={t('admin.userDetails')} />
        </Appbar.Header>

        <ScrollView style={styles.scrollView}>
          {/* User Header */}
          <Card style={styles.headerCard}>
            <Card.Content style={styles.headerContent}>
              <Avatar.Text
                size={80}
                label={user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                style={[styles.avatar, { backgroundColor: getRoleColor(user?.role ?? 'USER') }]}
              />
              <Text variant="headlineMedium" style={styles.userName}>
                {user?.name ?? 'Unknown'}
              </Text>
              <Text variant="bodyMedium" style={styles.userEmail}>
                {user?.email ?? ''}
              </Text>
              <View style={styles.badgesRow}>
                <Chip
                  style={[styles.roleChip, { backgroundColor: getRoleColor(user?.role ?? 'USER') }]}
                  textStyle={styles.roleChipText}
                >
                  {user?.role ?? 'USER'}
                </Chip>
                {user?.isactive ? (
                  <Chip style={styles.activeChip} icon="check-circle">
                    {t('admin.active')}
                  </Chip>
                ) : (
                  <Chip style={styles.suspendedChip} icon="alert-circle">
                    {t('admin.suspended')}
                  </Chip>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Suspension Info */}
          {!user?.isactive && user?.suspensionreason && (
            <Card style={styles.suspensionCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.suspensionTitle}>
                  🚫 {t('admin.suspensionReason')}
                </Text>
                <Text variant="bodyMedium" style={styles.suspensionText}>
                  {user.suspensionreason}
                </Text>
                {user?.suspendedat && (
                  <Text variant="bodySmall" style={styles.suspensionDate}>
                    {t('admin.suspendedAt')}: {formatTimestamp(user.suspendedat)}
                  </Text>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Stats Card */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                📊 {t('common.statistics')}
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text variant="displaySmall" style={styles.statValue}>
                    {user?._count?.posts ?? 0}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    {t('admin.posts')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="displaySmall" style={styles.statValue}>
                    {user?._count?.comments ?? 0}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    {t('admin.comments')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="displaySmall" style={styles.statValue}>
                    {user?._count?.reactions ?? 0}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    {t('admin.reactions')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="displaySmall" style={styles.statValue}>
                    {user?._count?.flagsreported ?? 0}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    {t('admin.reports')}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Profile Info */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                👤 {t('profile.title')}
              </Text>
              <List.Item
                title={t('profile.localChurch')}
                description={user?.localchurch ?? t('common.notSpecified')}
                left={(props) => <List.Icon {...props} icon="church" />}
              />
              <Divider />
              <List.Item
                title={t('profile.ministry')}
                description={user?.ministry ?? t('common.notSpecified')}
                left={(props) => <List.Icon {...props} icon="hand-heart" />}
              />
              <Divider />
              <List.Item
                title={t('profile.country')}
                description={user?.country ?? t('common.notSpecified')}
                left={(props) => <List.Icon {...props} icon="earth" />}
              />
              <Divider />
              <List.Item
                title={t('profile.language')}
                description={user?.preferredlanguage === 'es' ? 'Español' : 'English'}
                left={(props) => <List.Icon {...props} icon="translate" />}
              />
              <Divider />
              <List.Item
                title={t('profile.timezone')}
                description={user?.timezone ?? t('common.notSpecified')}
                left={(props) => <List.Icon {...props} icon="clock" />}
              />
            </Card.Content>
          </Card>

          {/* Account Info */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                📅 {t('common.info')}
              </Text>
              <List.Item
                title={t('admin.memberSince')}
                description={formatTimestamp(user?.createdat ?? '')}
                left={(props) => <List.Icon {...props} icon="calendar-plus" />}
              />
              <Divider />
              <List.Item
                title={t('admin.lastLogin')}
                description={user?.lastloginat ? formatTimestamp(user.lastloginat) : t('common.never')}
                left={(props) => <List.Icon {...props} icon="login" />}
              />
            </Card.Content>
          </Card>

          {/* Recent Posts */}
          {user?.recentPosts && user?.recentPosts?.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  📝 {t('home.recentPosts')}
                </Text>
                {user.recentPosts.map((post, index) => (
                  <View key={post?.id ?? index}>
                    <List.Item
                      title={post?.textcontent?.substring(0, 60) ?? post?.contenttype ?? ''}
                      description={`${formatTimestamp(post?.createdat ?? '')} • ❤️ ${post?._count?.reactions ?? 0} • 💬 ${post?._count?.comments ?? 0}`}
                      left={(props) => <List.Icon {...props} icon="post" />}
                    />
                    {index < user.recentPosts.length - 1 && <Divider />}
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#fff',
    margin: 0,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    elevation: 4,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    marginBottom: 16,
  },
  userName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: '#666',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  roleChip: {
    height: 32,
  },
  roleChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeChip: {
    backgroundColor: '#c8e6c9',
    height: 32,
  },
  suspendedChip: {
    backgroundColor: '#ffcdd2',
    height: 32,
  },
  suspensionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffebee',
    elevation: 2,
  },
  suspensionTitle: {
    color: '#c62828',
    fontWeight: '600',
    marginBottom: 8,
  },
  suspensionText: {
    color: '#d32f2f',
    marginBottom: 8,
  },
  suspensionDate: {
    color: '#999',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 16,
    color: '#6200ea',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statValue: {
    fontWeight: '700',
    color: '#6200ea',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
  },
  bottomSpace: {
    height: 32,
  },
});

export default UserDetailsModal;
