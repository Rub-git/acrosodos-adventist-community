import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import ValuesAcceptanceScreen from '../screens/auth/ValuesAcceptanceScreen';

// Legal Screens
import { TermsAndConditionsScreen, PrivacyPolicyScreen, CommunityGuidelinesScreen } from '../screens/legal';

// Main App
import MainTabNavigator from './MainTabNavigator';

import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('[RootNavigator] Rendering - user:', !!user, 'loading:', loading, 'hasacceptedvalues:', user?.hasacceptedvalues);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Not logged in - show auth screens
  if (!user) {
    console.log('[RootNavigator] Showing Auth Stack');
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="CommunityGuidelines" component={CommunityGuidelinesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Logged in but hasn't accepted values
  if (!user?.hasacceptedvalues) {
    console.log('[RootNavigator] Showing Values Acceptance');
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="ValuesAcceptance" component={ValuesAcceptanceScreen} />
          <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="CommunityGuidelines" component={CommunityGuidelinesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Logged in and accepted values - show main app
  console.log('[RootNavigator] Showing Main App');
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
        <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="CommunityGuidelines" component={CommunityGuidelinesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
