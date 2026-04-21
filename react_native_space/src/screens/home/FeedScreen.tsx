import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Appbar, FAB, Banner } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types';
import { usePosts } from '../../hooks/usePosts';
import { useSabbath } from '../../hooks/useSabbath';
import { useLocalization } from '../../contexts/LocalizationContext';
import PostCard from '../../components/PostCard';
import LoadingSpinner from '../../components/LoadingSpinner';

type FeedScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Feed'>;

const FeedScreen: React.FC = () => {
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const { posts, loading, refreshing, hasMore, fetchPosts, refresh, loadMore } = usePosts();
  const { sabbathStatus } = useSabbath();
  const { t } = useLocalization();

  useEffect(() => {
    fetchPosts();
  }, []);

  // Only refresh when coming back to this screen from another tab
  const [hasLoaded, setHasLoaded] = useState(false);
  useFocusEffect(
    React.useCallback(() => {
      if (hasLoaded) {
        refresh();
      } else {
        setHasLoaded(true);
      }
    }, [hasLoaded])
  );

  const handlePostPress = (postId: string) => {
    navigation.navigate('PostDetail', { postId });
  };

  if (loading && (posts?.length ?? 0) === 0) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.Content title={t('home.title')} />
      </Appbar.Header>

      {sabbathStatus?.isSabbath && (
        <Banner
          visible={true}
          icon="weather-sunset"
          style={styles.sabbathBanner}
        >
          {t('sabbath.activeTitle')} - {t('sabbath.greeting')}
        </Banner>
      )}

      <FlatList
        data={posts ?? []}
        keyExtractor={(item, index) => item?.id ?? `post-${index}`}
        renderItem={({ item }) => (
          <PostCard post={item} onPress={() => handlePostPress(item?.id ?? '')} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && (posts?.length ?? 0) === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('feed.noPosts')}</Text>
              <Text style={styles.emptySubtext}>{t('feed.beTheFirst')}</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  listContent: {
    paddingBottom: 16,
  },
  sabbathBanner: {
    backgroundColor: '#F0E6FF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default FeedScreen;
