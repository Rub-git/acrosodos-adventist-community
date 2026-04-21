import { useState, useCallback } from 'react';
import { Post, FeedQueryDto, FeedResponse } from '../types';
import apiService from '../services/api';

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchPosts = useCallback(async (params: FeedQueryDto = {}, append = false) => {
    try {
      if (append) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await apiService.getAxiosInstance().get<FeedResponse>('/posts/feed', {
        params: { page: append ? page : 1, limit: 20, ...params },
      });

      const data = response?.data ?? { posts: [], total: 0, page: 1, limit: 20, totalPages: 1 };
      const newPosts = data?.posts ?? [];

      if (append) {
        setPosts((prev) => [...(prev ?? []), ...newPosts]);
        setPage((p) => p + 1);
      } else {
        setPosts(newPosts);
        setPage(2);
      }

      setHasMore((data?.page ?? 0) < (data?.totalPages ?? 0));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  const refresh = useCallback(() => {
    setPage(1);
    return fetchPosts({}, false);
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      return fetchPosts({}, true);
    }
  }, [loading, hasMore, fetchPosts]);

  return {
    posts,
    loading,
    refreshing,
    hasMore,
    fetchPosts,
    refresh,
    loadMore,
  };
};
