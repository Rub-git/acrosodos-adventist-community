import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '../../contexts/LocalizationContext';

const PrivacyPolicyScreen: React.FC = () => {
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
        <Text style={styles.mainTitle}>{t('legal.privacyPolicy.title') || 'Privacy Policy'}</Text>

        <Text style={styles.sectionTitle}>1. {t('legal.privacyPolicy.section1Title')?.replace('1. ', '') || 'Information We Collect'}</Text>
        <Text style={styles.paragraph}>{t('legal.privacyPolicy.section1Content') || 'We collect information you provide directly.'}</Text>

        <Text style={styles.sectionTitle}>2. {t('legal.privacyPolicy.section2Title')?.replace('2. ', '') || 'How We Use Information'}</Text>
        <Text style={styles.paragraph}>{t('legal.privacyPolicy.section2Content') || 'We use your information to provide services.'}</Text>

        <Text style={styles.sectionTitle}>3. {t('legal.privacyPolicy.section3Title')?.replace('3. ', '') || 'Information Sharing'}</Text>
        <Text style={styles.paragraph}>{t('legal.privacyPolicy.section3Content') || 'We do not sell your personal information.'}</Text>

        <Text style={styles.sectionTitle}>4. {t('legal.privacyPolicy.section4Title')?.replace('4. ', '') || 'Data Security'}</Text>
        <Text style={styles.paragraph}>{t('legal.privacyPolicy.section4Content') || 'We implement security measures.'}</Text>

        <Text style={styles.sectionTitle}>5. {t('legal.privacyPolicy.section5Title')?.replace('5. ', '') || 'Your Rights'}</Text>
        <Text style={styles.paragraph}>{t('legal.privacyPolicy.section5Content') || 'You can access, update, or delete your data.'}</Text>

        <Text style={styles.sectionTitle}>6. {t('legal.privacyPolicy.section6Title')?.replace('6. ', '') || 'Contact Us'}</Text>
        <Text style={styles.paragraph}>{t('legal.privacyPolicy.section6Content') || 'Contact us for privacy questions.'}</Text>
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

export default PrivacyPolicyScreen;
