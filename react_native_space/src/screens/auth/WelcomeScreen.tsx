import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from 'react-native-paper';
import { RootStackParamList, Language } from '../../types';
import { useLocalization } from '../../contexts/LocalizationContext';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { changeLanguage, t } = useLocalization();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.en);

  const handleLanguageSelect = async (lang: Language) => {
    setSelectedLanguage(lang);
    await changeLanguage(lang);
  };

  const handleGetStarted = () => {
    navigation.navigate('Login');
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textSection}>
          <Text style={styles.appName}>Acrosodos</Text>
          <Text style={styles.title}>{t('welcome.title')}</Text>
          <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
        </View>

        <View style={styles.languageSection}>
          <Text style={styles.languageTitle}>{t('welcome.selectLanguage')}</Text>
          <View style={styles.languageButtons}>
            <Button
              mode={selectedLanguage === Language.en ? 'contained' : 'outlined'}
              onPress={() => handleLanguageSelect(Language.en)}
              style={styles.languageButton}
              compact
            >
              English
            </Button>
            <Button
              mode={selectedLanguage === Language.es ? 'contained' : 'outlined'}
              onPress={() => handleLanguageSelect(Language.es)}
              style={styles.languageButton}
              compact
            >
              Español
            </Button>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleGetStarted}
          style={styles.getStartedButton}
          contentStyle={styles.getStartedButtonContent}
          labelStyle={styles.getStartedButtonLabel}
        >
          {t('welcome.getStarted')}
        </Button>

        <Button
          mode="text"
          onPress={handlePrivacyPolicy}
          style={styles.privacyLink}
          labelStyle={styles.privacyLinkText}
        >
          {t('legal.privacyPolicy.title')}
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  content: { flex: 1, paddingHorizontal: 24, paddingVertical: 16, justifyContent: 'center' },
  logoSection: { alignItems: 'center', marginBottom: 0 },
  logo: { width: 280, height: 140 },
  textSection: { alignItems: 'center', marginBottom: 24 },
  appName: { fontSize: 26, fontWeight: 'bold', color: '#6200ea', marginBottom: 4, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, paddingHorizontal: 8 },
  languageSection: { marginBottom: 24 },
  languageTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', textAlign: 'center', marginBottom: 12 },
  languageButtons: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  languageButton: { flex: 1 },
  getStartedButton: { marginHorizontal: 16 },
  getStartedButtonContent: { paddingVertical: 6 },
  getStartedButtonLabel: { fontSize: 18, fontWeight: '700' },
  privacyLink: { marginTop: 16 },
  privacyLinkText: { fontSize: 14, color: '#666' },
});

export default WelcomeScreen;
