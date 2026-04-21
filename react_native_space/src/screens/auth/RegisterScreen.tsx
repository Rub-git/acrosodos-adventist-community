import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { TextInput, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Language } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import { validateEmail, validatePassword } from '../../utils/validation';
import apiService from '../../services/api';
import * as Location from 'expo-location';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register } = useAuth();
  const { t, locale } = useLocalization();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    localChurch: '',
    ministry: '',
    country: '',
  });
  
  const [timezone, setTimezone] = useState('America/New_York');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    detectTimezone();
  }, []);

  const detectTimezone = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const detectedTimezone = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone;
        if (detectedTimezone) {
          setTimezone(detectedTimezone);
        }
      }
    } catch (error) {
      console.error('Error detecting timezone:', error);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = t('errors.required');
    if (!formData.email) {
      newErrors.email = t('errors.required');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('errors.invalidEmail');
    }

    if (!formData.password) {
      newErrors.password = t('errors.required');
    } else if (!validatePassword(formData.password)) {
      newErrors.password = t('errors.passwordTooShort');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    const isValid = validate();
    if (!isValid) return;

    try {
      setLoading(true);
      const payload = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        preferredLanguage: locale as Language,
        timezone,
        localChurch: formData.localChurch || undefined,
        ministry: formData.ministry || undefined,
        country: formData.country || undefined,
      };
      await register(payload);
    } catch (error) {
      const message = apiService.handleError(error);
      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t('auth.register')}</Text>

          <Surface style={styles.formContainer}>
            <View style={styles.row}>
              <TextInput
                label={t('auth.name')}
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                error={!!errors?.name}
                style={styles.inputHalf}
                mode="outlined"
                dense
              />
              <TextInput
                label={t('auth.email')}
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors?.email}
                style={styles.inputHalf}
                mode="outlined"
                dense
              />
            </View>

            <View style={styles.row}>
              <TextInput
                label={t('auth.password')}
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                secureTextEntry
                autoCapitalize="none"
                error={!!errors?.password}
                style={styles.inputHalf}
                mode="outlined"
                dense
              />
              <TextInput
                label={t('auth.confirmPassword')}
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                secureTextEntry
                autoCapitalize="none"
                error={!!errors?.confirmPassword}
                style={styles.inputHalf}
                mode="outlined"
                dense
              />
            </View>

            <Text style={styles.sectionTitle}>{t('profile.optionalInfo') || 'Optional'}</Text>

            <View style={styles.row}>
              <TextInput
                label={t('profile.localChurch')}
                value={formData.localChurch}
                onChangeText={(text) => updateFormData('localChurch', text)}
                style={styles.inputThird}
                mode="outlined"
                dense
              />
              <TextInput
                label={t('profile.ministry')}
                value={formData.ministry}
                onChangeText={(text) => updateFormData('ministry', text)}
                style={styles.inputThird}
                mode="outlined"
                dense
              />
              <TextInput
                label={t('profile.country')}
                value={formData.country}
                onChangeText={(text) => updateFormData('country', text)}
                style={styles.inputThird}
                mode="outlined"
                dense
              />
            </View>
          </Surface>

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.registerButton}
          >
            {t('auth.signUp')}
          </Button>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')}</Text>
            <Button mode="text" onPress={() => navigation.navigate('Login')} disabled={loading}>
              {t('auth.signIn')}
            </Button>
          </View>
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
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 100,
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  formContainer: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  inputHalf: {
    flex: 1,
  },
  inputThird: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
    marginBottom: 4,
  },
  registerButton: {
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
});

export default RegisterScreen;
