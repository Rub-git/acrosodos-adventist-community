import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeStackParamList } from '../types';

// Screens
import FeedScreen from '../screens/home/FeedScreen';
import PostDetailScreen from '../screens/home/PostDetailScreen';

const Stack = createStackNavigator<HomeStackParamList>();

const HomeStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Feed" 
        component={FeedScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PostDetail" 
        component={PostDetailScreen}
        options={{ 
          title: 'Post',
          headerStyle: { backgroundColor: '#4A90E2' },
          headerTintColor: '#FFFFFF',
        }}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
