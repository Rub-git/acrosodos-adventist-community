import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, MainTabParamList } from '../types';

// Screens
import HomeStackNavigator from './HomeStackNavigator';
import PostScreen from '../screens/post/PostScreen';
import ModerationScreen from '../screens/moderation/ModerationScreen';
import AdminScreen from '../screens/admin/AdminScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  const { user } = useAuth();
  const isModerator = user?.role === UserRole.MODERATOR || user?.role === UserRole.ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Post') {
            iconName = 'plus-circle';
          } else if (route.name === 'Moderation') {
            iconName = focused ? 'shield-check' : 'shield-check-outline';
          } else if (route.name === 'Admin') {
            iconName = focused ? 'shield-crown' : 'shield-crown-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: Platform.OS === 'web' ? {
          height: 70,
          paddingBottom: 5,
          paddingTop: 5,
        } : undefined,
        tabBarLabelStyle: Platform.OS === 'web' ? {
          fontSize: 12,
        } : undefined,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen 
        name="Post" 
        component={PostScreen}
        options={{ tabBarLabel: 'Publicar' }}
      />
      {isModerator && (
        <Tab.Screen 
          name="Moderation" 
          component={ModerationScreen}
          options={{ tabBarLabel: 'Reportes' }}
        />
      )}
      {isAdmin && (
        <Tab.Screen 
          name="Admin" 
          component={AdminScreen}
          options={{ tabBarLabel: 'Admin' }}
        />
      )}
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
