import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button, TextInput } from 'react-native-paper';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import { validateEmail } from '../../utils/validation';
import apiService from '../../services/api';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

// Cross-platform alert function
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const authContext = useAuth();
  const { t } = useLocalization();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [statusMessage, setStatusMessage] = useState('');

  const handleLogin = async () => {
    console.log('=== LOGIN BUTTON CLICKED ===' );
    setStatusMessage('Validating...');
    
    if (loading) {
      console.log('Already loading, ignoring');
      return;
    }
    
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = t('errors.required') || 'Required';
    else if (!validateEmail(email)) newErrors.email = t('errors.invalidEmail') || 'Invalid email';
    if (!password) newErrors.password = t('errors.required') || 'Required';
    
    if (Object.keys(newErrors).length > 0) {
      console.log('Validation errors:', newErrors);
      setErrors(newErrors);
      setStatusMessage('');
      return;
    }
    
    setErrors({});
    setLoading(true);
    setStatusMessage('Signing in...');
    console.log('Calling API login with email:', email);
    
    try {
      await authContext?.login?.({ email, password });
      console.log('Login successful! Navigation should happen automatically.');
      setStatusMessage('Success! Redirecting...');
    } catch (error: any) {
      console.error('Login error:', error);
      const message = apiService.handleError(error);
      setStatusMessage('');
      setLoading(false);
      showAlert(t('common.error') || 'Error', message);
    }
  };

  const handleRegister = () => {
    console.log('Register pressed');
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>{t('auth.login') || 'Login'}</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              label={t('auth.email') || 'Email'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              error={!!errors?.email}
              disabled={loading}
              style={styles.input}
            />
            {errors?.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <TextInput
              label={t('auth.password') || 'Password'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              mode="outlined"
              error={!!errors?.password}
              disabled={loading}
              style={styles.input}
            />
            {errors?.password && <Text style={styles.errorText}>{errors.password}</Text>}

            {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
              labelStyle={styles.loginButtonLabel}
            >
              {t('auth.signIn') || 'Sign In'}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading}
              style={styles.forgotPasswordButton}
            >
              {t('auth.forgotPassword') || 'Forgot Password?'}
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.dontHaveAccount') || "Don't have an account?"}</Text>
            <Button mode="text" onPress={handleRegister} disabled={loading}>
              {t('auth.signUp') || 'Sign Up'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 280, height: 140, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A' },
  formContainer: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: { marginBottom: 12, backgroundColor: '#FAFAFA' },
  errorText: { color: '#D32F2F', fontSize: 12, marginTop: -8, marginBottom: 8 },
  statusText: { color: '#6200ea', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  loginButton: { marginTop: 8, backgroundColor: '#6200ea' },
  loginButtonContent: { paddingVertical: 8 },
  loginButtonLabel: { fontSize: 18, fontWeight: '700' },
  forgotPasswordButton: { marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  footerText: { fontSize: 16, color: '#666' },
});

export default LoginScreen;
