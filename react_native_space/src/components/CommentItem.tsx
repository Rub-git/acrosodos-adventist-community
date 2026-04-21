import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { Surface, IconButton, Menu } from 'react-native-paper';
import { Comment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { formatTimestamp } from '../utils/formatters';
import { UserRole } from '../types';

interface CommentItemProps {
  comment: Comment;
  onDelete: (commentId: string) => Promise<void>;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onDelete }) => {
  const { user } = useAuth();
  const { t } = useLocalization();
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = comment?.userid === user?.id || user?.role === UserRole.MODERATOR || user?.role === UserRole.ADMIN;

  const handleDelete = async () => {
    setMenuVisible(false);
    Alert.alert(
      t('common.delete'),
      'Are you sure you want to delete this comment?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await onDelete(comment?.id ?? '');
            } catch (error) {
              console.error('Error deleting comment:', error);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {comment?.user?.profilepictureurl ? (
              <Image source={{ uri: comment.user.profilepictureurl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {comment?.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.userName}>{comment?.user?.name ?? 'Unknown'}</Text>
            <Text style={styles.timestamp}>{formatTimestamp(comment?.createdat ?? '')}</Text>
          </View>
        </View>
        {canDelete && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={16}
                onPress={() => setMenuVisible(true)}
                disabled={deleting}
              />
            }
          >
            <Menu.Item onPress={handleDelete} title={t('common.delete')} />
          </Menu>
        )}
      </View>
      <Text style={styles.content}>{comment?.content ?? ''}</Text>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
});

export default CommentItem;
