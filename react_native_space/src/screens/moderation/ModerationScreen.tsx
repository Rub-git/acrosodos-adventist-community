import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { Appbar, SegmentedButtons, Surface, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flag, FlagStatus } from '../../types';
import { useLocalization } from '../../contexts/LocalizationContext';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatTimestamp } from '../../utils/formatters';

const ModerationScreen: React.FC = () => {
  const { t } = useLocalization();
  const [status, setStatus] = useState<'PENDING' | 'REVIEWED'>('PENDING');
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlags();
  }, [status]);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAxiosInstance().get<{ flags: Flag[], pagination: any }>('/moderation/queue', {
        params: { status },
      });
      console.log(`[ModerationScreen] Fetched ${response?.data?.flags?.length ?? 0} flags with status: ${status}`);
      console.log('[ModerationScreen] Full response:', JSON.stringify(response?.data, null, 2));
      setFlags(response?.data?.flags ?? []);
    } catch (error) {
      console.error('[ModerationScreen] Error fetching flags:', error);
      Alert.alert(t('common.error'), apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleReviewFlag = async (flagId: string, action: 'hide' | 'dismiss') => {
    try {
      if (action === 'hide') {
        // Show prompt for hide reason
        Alert.prompt(
          'Hide Content',
          'Enter reason for hiding this content',
          async (reason) => {
            if (reason) {
              await apiService.getAxiosInstance().post(`/moderation/flags/${flagId}/review`, {
                status: 'REVIEWED',
                reviewNotes: reason,
              });
              await fetchFlags();
              Alert.alert(t('common.success'), 'Content hidden successfully');
            }
          },
          'plain-text'
        );
      } else {
        await apiService.getAxiosInstance().post(`/moderation/flags/${flagId}/review`, {
          status: 'DISMISSED',
          reviewNotes: 'Flag dismissed by moderator',
        });
        await fetchFlags();
        Alert.alert(t('common.success'), 'Flag dismissed successfully');
      }
    } catch (error) {
      console.error('[ModerationScreen] Error reviewing flag:', error);
      Alert.alert(t('common.error'), apiService.handleError(error));
    }
  };

  const renderFlagItem = ({ item }: { item: Flag }) => (
    <Surface style={styles.flagItem}>
      <Text style={styles.reason}>{item?.reason ?? ''}</Text>
      {item?.description && <Text style={styles.description}>{item.description}</Text>}
      
      <View style={styles.contentPreview}>
        {item?.post && (
          <>
            <Text style={styles.contentLabel}>Post reportado:</Text>
            {item.post.textcontent ? (
              <Text style={styles.contentText} numberOfLines={3}>
                {item.post.textcontent}
              </Text>
            ) : (
              <Text style={styles.contentText}>
                [Post con contenido multimedia - sin texto]
              </Text>
            )}
          </>
        )}
        {item?.comment?.content && (
          <>
            <Text style={styles.contentLabel}>Comentario reportado:</Text>
            <Text style={styles.contentText} numberOfLines={3}>
              {item.comment.content}
            </Text>
          </>
        )}
      </View>

      <View style={styles.metadata}>
        <Text style={styles.metaText}>
          Reported by: {item?.reporter?.name ?? 'Unknown'}
        </Text>
        <Text style={styles.metaText}>
          {formatTimestamp(item?.createdat ?? '')}
        </Text>
      </View>

      {status === 'PENDING' && (
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => handleReviewFlag(item?.id ?? '', 'dismiss')}
            style={styles.actionButton}
          >
            {t('moderation.dismiss')}
          </Button>
          <Button
            mode="contained"
            onPress={() => handleReviewFlag(item?.id ?? '', 'hide')}
            style={styles.actionButton}
            buttonColor="#D32F2F"
          >
            {t('moderation.hide')}
          </Button>
        </View>
      )}

      {status === 'REVIEWED' && item?.reviewnotes && (
        <Text style={styles.reviewNotes}>Notes: {item.reviewnotes}</Text>
      )}
    </Surface>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.Content title={t('moderation.title')} />
        <Appbar.Action icon="refresh" onPress={fetchFlags} />
      </Appbar.Header>

      <View style={styles.content}>
        <SegmentedButtons
          value={status}
          onValueChange={(value) => setStatus(value as 'PENDING' | 'REVIEWED')}
          buttons={[
            { value: 'PENDING', label: t('moderation.pending') },
            { value: 'REVIEWED', label: t('moderation.reviewed') },
          ]}
          style={styles.segmentedButtons}
        />

        {loading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={flags ?? []}
            keyExtractor={(item) => item?.id ?? ''}
            renderItem={renderFlagItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No flags to review</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  content: {
    flex: 1,
  },
  segmentedButtons: {
    margin: 16,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  flagItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  reason: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  contentPreview: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  contentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  contentText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  metadata: {
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  reviewNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default ModerationScreen;
