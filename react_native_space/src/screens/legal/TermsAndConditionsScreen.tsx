import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '../../contexts/LocalizationContext';

const TermsAndConditionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useLocalization();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#6200ea" />
          <Text style={styles.backText}>{t('common.back') || 'Back'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.mainTitle}>{t('legal.termsAndConditions.title') || 'Terms and Conditions'}</Text>

        <Text style={styles.sectionTitle}>1. {t('legal.termsAndConditions.section1Title')?.replace('1. ', '') || 'Acceptance of Terms'}</Text>
        <Text style={styles.paragraph}>{t('legal.termsAndConditions.section1Content') || 'By accessing this app, you agree to these terms.'}</Text>

        <Text style={styles.sectionTitle}>2. {t('legal.termsAndConditions.section2Title')?.replace('2. ', '') || 'Use License'}</Text>
        <Text style={styles.paragraph}>{t('legal.termsAndConditions.section2Content') || 'Permission granted for personal use.'}</Text>

        <Text style={styles.sectionTitle}>3. {t('legal.termsAndConditions.section3Title')?.replace('3. ', '') || 'User Responsibilities'}</Text>
        <Text style={styles.paragraph}>{t('legal.termsAndConditions.section3Content') || 'Keep your account information confidential.'}</Text>

        <Text style={styles.sectionTitle}>4. {t('legal.termsAndConditions.section4Title')?.replace('4. ', '') || 'Prohibited Activities'}</Text>
        <Text style={styles.paragraph}>{t('legal.termsAndConditions.section4Content') || 'Do not use for unlawful purposes.'}</Text>

        <Text style={styles.sectionTitle}>5. {t('legal.termsAndConditions.section5Title')?.replace('5. ', '') || 'Content Guidelines'}</Text>
        <Text style={styles.paragraph}>{t('legal.termsAndConditions.section5Content') || 'Content must be appropriate.'}</Text>

        <Text style={styles.sectionTitle}>6. {t('legal.termsAndConditions.section6Title')?.replace('6. ', '') || 'Termination'}</Text>
        <Text style={styles.paragraph}>{t('legal.termsAndConditions.section6Content') || 'We may terminate accounts that violate terms.'}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  backText: {
    fontSize: 14,
    color: '#6200ea',
    marginLeft: 6,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    marginBottom: 2,
  },
  paragraph: {
    fontSize: 11,
    color: '#444',
    lineHeight: 16,
  },
});

export default TermsAndConditionsScreen;
