import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Platform } from 'react-native';
import { Searchbar, Chip, Card, Text, Button, Avatar, Badge, IconButton, Menu } from 'react-native-paper';
import { useLocalization } from '../../contexts/LocalizationContext';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import UserDetailsModal from './UserDetailsModal';
import { formatTimestamp } from '../../utils/formatters';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isactive: boolean;
  suspensionreason?: string;
  suspendedat?: string;
  localchurch?: string;
  ministry?: string;
  country?: string;
  createdat: string;
  lastloginat?: string;
  profilepictureurl?: string;
  _count?: {
    posts: number;
    comments: number;
    flagsreported: number;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UsersTabProps {
  refreshTrigger: boolean;
}

const UsersTab: React.FC<UsersTabProps> = ({ refreshTrigger }) => {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, filterActive, refreshTrigger]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = { page: 1, limit: 50 };
      if (searchQuery) params.search = searchQuery;
      if (filterActive !== undefined) params.isActive = filterActive;

      const response = await apiService.getAxiosInstance().get<UsersResponse>('/admin/users', { params });
      setUsers(response?.data?.users ?? []);
    } catch (error) {
      console.error('[UsersTab] Error fetching users:', error);
      Alert.alert(t('common.error'), apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, userName: string) => {
    Alert.prompt(
      t('admin.suspendUser'),
      t('admin.confirmSuspend'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.suspendUser'),
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason || reason?.trim() === '') {
              Alert.alert(t('common.error'), t('admin.enterReason'));
              return;
            }
            try {
              await apiService.getAxiosInstance().post(`/admin/users/${userId}/suspend`, {
                reason: reason?.trim(),
              });
              Alert.alert(t('common.success'), t('admin.userSuspended'));
              fetchUsers();
            } catch (error) {
              Alert.alert(t('common.error'), apiService.handleError(error));
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const handleReactivateUser = async (userId: string, userName: string) => {
    Alert.alert(
      t('admin.reactivateUser'),
      t('admin.confirmReactivate'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.reactivateUser'),
          onPress: async () => {
            try {
              await apiService.getAxiosInstance().post(`/admin/users/${userId}/reactivate`);
              Alert.alert(t('common.success'), t('admin.userReactivated'));
              fetchUsers();
            } catch (error) {
              Alert.alert(t('common.error'), apiService.handleError(error));
            }
          },
        },
      ]
    );
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    Alert.alert(
      t('admin.resetPassword') || 'Reset Password',
      t('admin.confirmResetPassword') || `Are you sure you want to reset password for ${userEmail}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.resetPassword') || 'Reset Password',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.getAxiosInstance().post(`/admin/users/${userId}/reset-password`);
              const tempPassword = response?.data?.temporaryPassword;
              
              // Show the temporary password to admin
              Alert.alert(
                t('common.success'),
                `${t('admin.passwordResetSuccess') || 'Password reset successfully!'}\n\n${t('admin.temporaryPassword') || 'Temporary Password'}:\n${tempPassword}\n\n${t('admin.shareWithUser') || 'Share this password with the user.'}`,
                [{ text: t('common.ok') }]
              );
            } catch (error) {
              Alert.alert(t('common.error'), apiService.handleError(error));
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = async (userId: string) => {
    try {
      const response = await apiService.getAxiosInstance().get(`/admin/users/${userId}/details`);
      setSelectedUser(response?.data ?? null);
      setDetailsModalVisible(true);
    } catch (error) {
      Alert.alert(t('common.error'), apiService.handleError(error));
    }
  };

  const exportUsersToCSV = async () => {
    try {
      // Fetch all users without pagination limit
      const response = await apiService.getAxiosInstance().get<UsersResponse>('/admin/users', { 
        params: { page: 1, limit: 1000 } 
      });
      const allUsers = response?.data?.users ?? [];

      if (allUsers.length === 0) {
        Alert.alert(t('common.error'), 'No hay usuarios para exportar');
        return;
      }

      // Create CSV content
      const headers = ['Nombre', 'Email', 'Rol', 'Estado', 'Iglesia Local', 'Ministerio', 'País', 'Fecha de Registro', 'Último Acceso'];
      const csvRows = [headers.join(',')];

      allUsers.forEach((user) => {
        const row = [
          `"${user?.name ?? ''}"`,
          `"${user?.email ?? ''}"`,
          user?.role ?? '',
          user?.isactive ? 'Activo' : 'Suspendido',
          `"${user?.localchurch ?? ''}"`,
          `"${user?.ministry ?? ''}"`,
          `"${user?.country ?? ''}"`,
          formatTimestamp(user?.createdat ?? ''),
          user?.lastloginat ? formatTimestamp(user.lastloginat) : 'Nunca',
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const fileName = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;

      if (Platform.OS === 'web') {
        // Web: Download using blob
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert(t('common.success'), `Lista de ${allUsers.length} usuarios exportada exitosamente`);
      } else {
        // Mobile: Save file and share
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, '\ufeff' + csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert(t('common.success'), `Archivo guardado en: ${fileUri}`);
        }
      }
    } catch (error) {
      console.error('[UsersTab] Error exporting users:', error);
      Alert.alert(t('common.error'), 'Error al exportar la lista de usuarios');
    }
  };

  const renderUserCard = ({ item }: { item: User }) => (
    <Card style={styles.userCard}>
      <Card.Content>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Avatar.Text
              size={48}
              label={item?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text variant="titleMedium" style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                  {item?.name?.split(' ')?.[0] ?? 'Unknown'}
                </Text>
                {!item?.isactive && (
                  <Badge size={20} style={styles.suspendedBadge}>
                    {t('admin.suspended')}
                  </Badge>
                )}
              </View>
              <Text variant="bodySmall" style={styles.userEmail} numberOfLines={1}>
                {item?.email ?? ''}
              </Text>
              <View style={styles.userMeta}>
                <Chip 
                  compact 
                  style={styles.roleChip}
                  textStyle={styles.roleChipText}
                >
                  {item?.role ?? 'USER'}
                </Chip>
                {item?.country && (
                  <Text variant="bodySmall" style={styles.metaText}>
                    📍 {item.country}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <View style={styles.menuContainer}>
            <Menu
              visible={menuVisible === item?.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <Button
                  mode="contained"
                  onPress={() => setMenuVisible(item?.id ?? null)}
                  style={styles.menuButton}
                  contentStyle={styles.menuButtonContent}
                  labelStyle={styles.menuButtonLabel}
                  buttonColor="#6200ea"
                  compact
                >
                  ⋮
                </Button>
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleViewDetails(item?.id ?? '');
                }}
                title={t('admin.viewDetails')}
                leadingIcon="eye"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleResetPassword(item?.id ?? '', item?.email ?? '');
                }}
                title={t('admin.resetPassword') || 'Reset Password'}
                leadingIcon="lock-reset"
              />
              {item?.isactive ? (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleSuspendUser(item?.id ?? '', item?.name ?? '');
                  }}
                  title={t('admin.suspendUser')}
                  leadingIcon="account-cancel"
                />
              ) : (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleReactivateUser(item?.id ?? '', item?.name ?? '');
                  }}
                  title={t('admin.reactivateUser')}
                  leadingIcon="account-check"
                />
              )}
            </Menu>
          </View>
        </View>

        {item?.suspensionreason && (
          <View style={styles.suspensionInfo}>
            <Text variant="bodySmall" style={styles.suspensionReason}>
              🚫 {item.suspensionreason}
            </Text>
          </View>
        )}

        <View style={styles.userStats}>
          <View style={styles.stat}>
            <Text variant="bodySmall" style={styles.statLabel}>
              {t('admin.posts')}
            </Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {item?._count?.posts ?? 0}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text variant="bodySmall" style={styles.statLabel}>
              {t('admin.comments')}
            </Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {item?._count?.comments ?? 0}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text variant="bodySmall" style={styles.statLabel}>
              {t('admin.reports')}
            </Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {item?._count?.flagsreported ?? 0}
            </Text>
          </View>
        </View>

        <Text variant="bodySmall" style={styles.joinedDate}>
          {t('admin.memberSince')}: {formatTimestamp(item?.createdat ?? '')}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading && users?.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('admin.searchUsers')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.filterWrapper}>
        <Chip
          selected={filterActive === undefined}
          onPress={() => setFilterActive(undefined)}
          style={styles.filterChip}
          textStyle={styles.filterChipText}
        >
          Todos
        </Chip>
        <Chip
          selected={filterActive === true}
          onPress={() => setFilterActive(true)}
          style={styles.filterChip}
          textStyle={styles.filterChipText}
        >
          Activos
        </Chip>
        <Chip
          selected={filterActive === false}
          onPress={() => setFilterActive(false)}
          style={styles.filterChip}
          textStyle={styles.filterChipText}
        >
          Inactivos
        </Chip>
      </View>

      <View style={styles.exportContainer}>
        <Button
          mode="contained"
          onPress={exportUsersToCSV}
          icon="download"
          style={styles.exportButton}
          buttonColor="#4CAF50"
        >
          Exportar Lista de Usuarios
        </Button>
      </View>

      <FlatList
        data={users}
        renderItem={renderUserCard}
        keyExtractor={(item) => item?.id ?? ''}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">{t('common.noData')}</Text>
          </View>
        }
      />

      {selectedUser && (
        <UserDetailsModal
          visible={detailsModalVisible}
          user={selectedUser}
          onDismiss={() => {
            setDetailsModalVisible(false);
            setSelectedUser(null);
          }}
          onRefresh={fetchUsers}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  filterWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: '#fff',
    justifyContent: 'space-around',
  },
  filterChip: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  exportContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  exportButton: {
    borderRadius: 8,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    marginBottom: 12,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    backgroundColor: '#6200ea',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  userName: {
    fontWeight: '600',
    flexShrink: 1,
  },
  userEmail: {
    color: '#666',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  roleChip: {
    height: 28,
    paddingHorizontal: 8,
  },
  roleChipText: {
    fontSize: 11,
    lineHeight: 14,
  },
  metaText: {
    color: '#666',
  },
  suspendedBadge: {
    backgroundColor: '#d32f2f',
  },
  suspensionInfo: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  suspensionReason: {
    color: '#c62828',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '600',
    color: '#6200ea',
  },
  joinedDate: {
    color: '#999',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  menuContainer: {
    marginLeft: 8,
    flexShrink: 0,
  },
  menuButton: {
    minWidth: 40,
    borderRadius: 20,
  },
  menuButtonContent: {
    paddingHorizontal: 0,
    height: 36,
    width: 40,
  },
  menuButtonLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginHorizontal: 0,
  },
});

export default UsersTab;
