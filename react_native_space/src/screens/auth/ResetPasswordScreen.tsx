import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useLocalization } from '../../contexts/LocalizationContext';
import apiService from '../../services/api';
import { showAlert } from '../../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useLocalization();
  const email = route?.params?.email ?? '';
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async () => {
    setCodeError('');
    setPasswordError('');

    if (!resetCode?.trim()) {
      setCodeError(t?.('auth.codeRequired') ?? 'Reset code is required');
      return;
    }

    if (resetCode.length !== 6) {
      setCodeError(t?.('auth.invalidCode') ?? 'Reset code must be 6 digits');
      return;
    }

    if (!newPassword) {
      setPasswordError(t?.('auth.passwordRequired') ?? 'Password is required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(t?.('auth.passwordTooShort') ?? 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t?.('auth.passwordsDoNotMatch') ?? 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await apiService.getAxiosInstance().post('/auth/reset-password', {
        email,
        resetCode: resetCode.trim(),
        newPassword,
      });

      showAlert(
        t?.('auth.success') ?? 'Success',
        t?.('auth.passwordResetSuccess') ?? 'Your password has been reset successfully. You can now login with your new password.',
        [
          {
            text: t?.('common.ok') ?? 'OK',
            onPress: () => navigation.navigate('Login'),
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
            {t?.('auth.resetPassword') ?? 'Reset Password'}
          </Text>

          <Text variant="bodyMedium" style={styles.subtitle}>
            {t?.('auth.enterResetCode') ?? 'Enter the 6-digit code sent to your email and create a new password.'}
          </Text>

          <View style={styles.form}>
            <TextInput
              mode="outlined"
              label={t?.('auth.resetCode') ?? 'Reset Code'}
              value={resetCode}
              onChangeText={(text) => {
                setResetCode(text);
                setCodeError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              error={!!codeError}
              style={styles.input}
            />
            {codeError ? (
              <HelperText type="error" visible={true}>
                {codeError}
              </HelperText>
            ) : null}

            <TextInput
              mode="outlined"
              label={t?.('auth.newPassword') ?? 'New Password'}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setPasswordError('');
              }}
              secureTextEntry={!showPassword}
              right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
              error={!!passwordError}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label={t?.('auth.confirmPassword') ?? 'Confirm Password'}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setPasswordError('');
              }}
              secureTextEntry={!showConfirmPassword}
              right={<TextInput.Icon icon={showConfirmPassword ? 'eye-off' : 'eye'} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
              error={!!passwordError}
              style={styles.input}
            />
            {passwordError ? (
              <HelperText type="error" visible={true}>
                {passwordError}
              </HelperText>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              {t?.('auth.resetPassword') ?? 'Reset Password'}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              {t?.('common.back') ?? 'Back'}
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

export default ResetPasswordScreen;
