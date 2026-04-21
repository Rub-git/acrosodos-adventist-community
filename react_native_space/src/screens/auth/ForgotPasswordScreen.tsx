import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useLocalization } from '../../contexts/LocalizationContext';
import apiService from '../../services/api';
import { showAlert } from '../../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useLocalization();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setEmailError('');

    if (!email?.trim()) {
      setEmailError(t?.('auth.emailRequired') ?? 'Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(t?.('auth.invalidEmail') ?? 'Invalid email format');
      return;
    }

    try {
      setLoading(true);
      await apiService.getAxiosInstance().post('/auth/forgot-password', { email: email.trim() });
      
      showAlert(
        t?.('auth.success') ?? 'Success',
        t?.('auth.resetCodeSent') ?? 'If the email exists, a reset code has been sent. Please check your inbox.',
        [
          {
            text: t?.('common.ok') ?? 'OK',
            onPress: () => navigation.navigate('ResetPassword', { email: email.trim() }),
          },
        ]
      );
    } catch (error) {
      showAlert(
        t?.('common.error') ?? 'Error',
        apiService.handleError(error)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text variant="headlineMedium" style={styles.title}>
            {t?.('auth.forgotPassword') ?? 'Forgot Password'}
          </Text>

          <Text variant="bodyMedium" style={styles.subtitle}>
            {t?.('auth.enterEmailForReset') ?? 'Enter your email address and we\'ll send you a code to reset your password.'}
          </Text>

          <View style={styles.form}>
            <TextInput
              mode="outlined"
              label={t?.('auth.email') ?? 'Email'}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={!!emailError}
              style={styles.input}
            />
            {emailError ? (
              <HelperText type="error" visible={true}>
                {emailError}
              </HelperText>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              {t?.('auth.sendResetCode') ?? 'Send Reset Code'}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              {t?.('common.back') ?? 'Back to Login'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  logo: {
    width: 350,
    height: 150,
    marginBottom: 24,
  },
  title: {
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
  backButton: {
    marginTop: 8,
  },
});

export default ForgotPasswordScreen;
