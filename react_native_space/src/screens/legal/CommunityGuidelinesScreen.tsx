import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '../../contexts/LocalizationContext';

const CommunityGuidelinesScreen: React.FC = () => {
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
        <Text style={styles.mainTitle}>{t('legal.communityGuidelines.title') || 'Community Guidelines'}</Text>

        <Text style={styles.sectionTitle}>1. {t('legal.communityGuidelines.section1Title')?.replace('1. ', '') || 'Respect All Members'}</Text>
        <Text style={styles.paragraph}>{t('legal.communityGuidelines.section1Content') || 'Treat everyone with kindness and respect.'}</Text>

        <Text style={styles.sectionTitle}>2. {t('legal.communityGuidelines.section2Title')?.replace('2. ', '') || 'Share Appropriately'}</Text>
        <Text style={styles.paragraph}>{t('legal.communityGuidelines.section2Content') || 'Content should be uplifting and appropriate.'}</Text>

        <Text style={styles.sectionTitle}>3. {t('legal.communityGuidelines.section3Title')?.replace('3. ', '') || 'Protect Privacy'}</Text>
        <Text style={styles.paragraph}>{t('legal.communityGuidelines.section3Content') || 'Do not share others\' personal information.'}</Text>

        <Text style={styles.sectionTitle}>4. {t('legal.communityGuidelines.section4Title')?.replace('4. ', '') || 'No Harassment'}</Text>
        <Text style={styles.paragraph}>{t('legal.communityGuidelines.section4Content') || 'Harassment will not be tolerated.'}</Text>

        <Text style={styles.sectionTitle}>5. {t('legal.communityGuidelines.section5Title')?.replace('5. ', '') || 'Report Concerns'}</Text>
        <Text style={styles.paragraph}>{t('legal.communityGuidelines.section5Content') || 'Report content that violates guidelines.'}</Text>

        <Text style={styles.sectionTitle}>6. {t('legal.communityGuidelines.section6Title')?.replace('6. ', '') || 'Sabbath Observance'}</Text>
        <Text style={styles.paragraph}>{t('legal.communityGuidelines.section6Content') || 'Spiritual content only during Sabbath.'}</Text>
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

export default CommunityGuidelinesScreen;
