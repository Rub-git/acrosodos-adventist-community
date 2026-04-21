import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { HomeStackParamList, Post, Comment } from '../../types';
import { useLocalization } from '../../contexts/LocalizationContext';
import apiService from '../../services/api';
import PostCard from '../../components/PostCard';
import CommentItem from '../../components/CommentItem';
import LoadingSpinner from '../../components/LoadingSpinner';

type PostDetailRouteProp = RouteProp<HomeStackParamList, 'PostDetail'>;

const PostDetailScreen: React.FC = () => {
  const route = useRoute<PostDetailRouteProp>();
  const { t } = useLocalization();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, []);

  const fetchPost = async () => {
    try {
      const response = await apiService.getAxiosInstance().get<Post>(`/posts/${route?.params?.postId ?? ''}`);
      setPost(response?.data ?? null);
    } catch (error) {
      Alert.alert(t('common.error'), apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await apiService.getAxiosInstance().get<Comment[]>(
        `/posts/${route?.params?.postId ?? ''}/comments`
      );
      setComments(response?.data ?? []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      await apiService.getAxiosInstance().post(
        `/posts/${route?.params?.postId ?? ''}/comments`,
        { content: commentText }
      );
      setCommentText('');
      await fetchComments();
    } catch (error) {
      Alert.alert(t('common.error'), apiService.handleError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiService.getAxiosInstance().delete(`/comments/${commentId}`);
      await fetchComments();
    } catch (error) {
      Alert.alert(t('common.error'), apiService.handleError(error));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text>Post not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={styles.scrollView}>
          <PostCard post={post} onPress={() => {}} showFullContent />

          <Divider style={styles.divider} />

          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              {t('comments.title')} ({comments?.length ?? 0})
            </Text>

            {(comments?.length ?? 0) === 0 ? (
              <Text style={styles.noComments}>{t('comments.noComments')}</Text>
            ) : (
              comments?.map((comment, index) => (
                <CommentItem
                  key={comment?.id ?? `comment-${index}`}
                  comment={comment}
                  onDelete={handleDeleteComment}
                />
              )) ?? []
            )}
          </View>
        </ScrollView>

        <View style={styles.commentInput}>
          <TextInput
            mode="outlined"
            placeholder={t('comments.writeComment')}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleSubmitComment}
            loading={submitting}
            disabled={submitting || !commentText.trim()}
            style={styles.sendButton}
          >
            {t('comments.send')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  divider: {
    marginVertical: 16,
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  noComments: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  commentInput: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    alignSelf: 'flex-end',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostDetailScreen;
