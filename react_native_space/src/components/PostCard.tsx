import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { Card, Button, IconButton, Chip } from 'react-native-paper';
import { Video } from 'expo-av';
import { Audio } from 'expo-av';
import { Post, ReactionType } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContext';
import { formatTimestamp } from '../utils/formatters';
import apiService from '../services/api';
import ReportModal from './ReportModal';

interface PostCardProps {
  post: Post;
  onPress: () => void;
  showFullContent?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPress, showFullContent = false }) => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [audioSound, setAudioSound] = useState<Audio.Sound | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [reactions, setReactions] = useState({
    ENCOURAGES_ME: post?.reactions?.filter((r) => r?.reactiontype === ReactionType.ENCOURAGES_ME)?.length ?? 0,
    PRAYING_FOR_YOU: post?.reactions?.filter((r) => r?.reactiontype === ReactionType.PRAYING_FOR_YOU)?.length ?? 0,
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    post?.reactions?.find((r) => r?.userid === user?.id)?.reactiontype ?? null
  );

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      PRAYER_REQUEST: '#D32F2F',
      TESTIMONY: '#F5A623',
      BIBLICAL_REFLECTION: '#4A90E2',
      SABBATH_ACTIVITY: '#7B68EE',
      GENERAL_ENCOURAGEMENT: '#66BB6A',
    };
    return colors?.[category] ?? '#999';
  };

  const handleReaction = async (reactionType: ReactionType) => {
    try {
      await apiService.getAxiosInstance().post(
        `/posts/${post?.id ?? ''}/reactions`,
        { reactionType }
      );

      // Update local state
      if (userReaction === reactionType) {
        // Remove reaction
        setReactions((prev) => ({
          ...prev,
          [reactionType]: Math.max(0, (prev?.[reactionType] ?? 0) - 1),
        }));
        setUserReaction(null);
      } else {
        // Add or change reaction
        setReactions((prev) => ({
          ...prev,
          ...(userReaction ? { [userReaction]: Math.max(0, (prev?.[userReaction] ?? 0) - 1) } : {}),
          [reactionType]: (prev?.[reactionType] ?? 0) + 1,
        }));
        setUserReaction(reactionType);
      }
    } catch (error) {
      Alert.alert(t('common.error'), apiService.handleError(error));
    }
  };

  const handlePlayAudio = async () => {
    try {
      if (!post?.mediaurl) {
        console.error('[PostCard] No media URL for audio');
        return;
      }

      console.log('[PostCard] Play audio:', post.mediaurl);

      if (isAudioPlaying && audioSound) {
        // Pause audio
        await audioSound.pauseAsync();
        setIsAudioPlaying(false);
        console.log('[PostCard] Audio paused');
      } else if (audioSound) {
        // Resume audio
        await audioSound.playAsync();
        setIsAudioPlaying(true);
        console.log('[PostCard] Audio resumed');
      } else {
        // Load and play audio
        console.log('[PostCard] Loading audio from:', post.mediaurl);
        const { sound } = await Audio.Sound.createAsync(
          { uri: post.mediaurl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsAudioPlaying(false);
              console.log('[PostCard] Audio finished');
            }
          }
        );
        setAudioSound(sound);
        setIsAudioPlaying(true);
        console.log('[PostCard] Audio playing');
      }
    } catch (error) {
      console.error('[PostCard] Audio playback error:', error);
      Alert.alert(t('common.error'), 'Failed to play audio');
    }
  };

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      if (audioSound) {
        console.log('[PostCard] Unloading audio');
        audioSound.unloadAsync();
      }
    };
  }, [audioSound]);

  return (
    <Card style={styles.card} onPress={showFullContent ? undefined : onPress}>
      <Card.Content>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                {post?.user?.profilepictureurl ? (
                  <Image source={{ uri: post.user.profilepictureurl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {post?.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </Text>
                )}
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{post?.user?.name ?? 'Unknown'}</Text>
                <Text style={styles.timestamp}>{formatTimestamp(post?.createdat ?? '')}</Text>
              </View>
            </View>
            <IconButton
              icon="flag-outline"
              size={22}
              iconColor="#666"
              onPress={() => setReportModalVisible(true)}
              style={styles.reportButton}
            />
          </View>
          <Chip
            style={[styles.categoryChip, { backgroundColor: getCategoryColor(post?.category ?? '') }]}
            textStyle={styles.chipText}
            compact
          >
            {t(`categories.${post?.category ?? ''}`)}
          </Chip>
        </View>

        {post?.contenttype === 'TEXT' && (
          <Text style={styles.textContent}>
            {showFullContent ? post?.textcontent : (post?.textcontent?.slice(0, 200) ?? '') + ((post?.textcontent?.length ?? 0) > 200 ? '...' : '')}
          </Text>
        )}

        {post?.contenttype === 'IMAGE' && post?.mediaurl && (
          <Image 
            source={{ uri: post.mediaurl }} 
            style={styles.media}
            resizeMode="contain"
          />
        )}

        {post?.contenttype === 'VIDEO' && post?.mediaurl && (
          <>
            {(typeof document !== 'undefined' && typeof window !== 'undefined') ? (
              // Web: Use native HTML5 video element with error handling
              <div style={{ 
                width: '100%', 
                backgroundColor: '#000',
                borderRadius: 8,
                overflow: 'hidden',
                marginTop: 12,
                marginBottom: 12
              }}>
                <video
                  src={post.mediaurl}
                  controls
                  style={{
                    width: '100%',
                    maxHeight: 400,
                    objectFit: 'contain'
                  }}
                  preload="metadata"
                  onError={(e) => {
                    console.error('[PostCard] Video error:', {
                      url: post.mediaurl,
                      error: (e.target as HTMLVideoElement)?.error,
                      errorCode: (e.target as HTMLVideoElement)?.error?.code,
                      errorMessage: (e.target as HTMLVideoElement)?.error?.message
                    });
                  }}
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    console.log('[PostCard] Video metadata loaded:', {
                      url: post.mediaurl,
                      duration: video?.duration,
                      videoWidth: video?.videoWidth,
                      videoHeight: video?.videoHeight,
                      hasAudio: video?.mozHasAudio || video?.webkitAudioDecodedByteCount > 0 || (video as any)?.audioTracks?.length > 0,
                      muted: video?.muted,
                      volume: video?.volume
                    });
                  }}
                >
                  Your browser does not support the video tag or the video format.
                  <br />
                  <a href={post.mediaurl} download style={{ color: '#4A90E2' }}>
                    Download video to view
                  </a>
                </video>
              </div>
            ) : (
              // Native: Use Expo Video component
              <Video
                source={{ uri: post.mediaurl }}
                style={styles.media}
                useNativeControls
                contentFit="contain"
                shouldPlay={false}
              />
            )}
          </>
        )}

        {post?.contenttype === 'AUDIO' && post?.mediaurl && (
          <View style={styles.audioContainer}>
            <IconButton 
              icon={isAudioPlaying ? "pause-circle" : "play-circle"} 
              size={48} 
              onPress={handlePlayAudio}
              iconColor="#4A90E2"
            />
            <Text style={styles.audioText}>
              {isAudioPlaying ? t('common.playing') : t('common.tapToPlay')}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            mode={userReaction === ReactionType.ENCOURAGES_ME ? 'contained' : 'outlined'}
            onPress={() => handleReaction(ReactionType.ENCOURAGES_ME)}
            style={styles.reactionButton}
            compact
          >
            💙 {reactions?.ENCOURAGES_ME ?? 0}
          </Button>
          <Button
            mode={userReaction === ReactionType.PRAYING_FOR_YOU ? 'contained' : 'outlined'}
            onPress={() => handleReaction(ReactionType.PRAYING_FOR_YOU)}
            style={styles.reactionButton}
            compact
          >
            🙏 {reactions?.PRAYING_FOR_YOU ?? 0}
          </Button>
          {!showFullContent && (
            <Button mode="text" onPress={onPress} compact>
              💬 {post?._count?.comments ?? 0}
            </Button>
          )}
        </View>
      </Card.Content>

      <ReportModal
        visible={reportModalVisible}
        onDismiss={() => setReportModalVisible(false)}
        contentId={post?.id ?? ''}
        contentType="post"
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    marginTop: 12,
  },
  headerContainer: {
    marginBottom: 12,
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
  userDetails: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    height: 30,
    paddingHorizontal: 12,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    paddingTop: 2,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  audioContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginBottom: 12,
  },
  audioText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  reactionButton: {
    marginRight: 8,
  },
  reportButton: {
    margin: 0,
  },
});

export default PostCard;
