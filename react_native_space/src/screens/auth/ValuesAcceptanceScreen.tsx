import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Surface, Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import apiService from '../../services/api';

const ValuesAcceptanceScreen: React.FC = () => {
  const { acceptValues } = useAuth();
  const { t } = useLocalization();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    console.log('[ValuesAcceptance] Button clicked! agreed:', agreed);
    
    if (!agreed) {
      console.log('[ValuesAcceptance] User has not checked the box');
      Alert.alert(t('values.title'), t('values.mustAccept'));
      return;
    }

    try {
      console.log('[ValuesAcceptance] Calling acceptValues...');
      setLoading(true);
      await acceptValues();
      console.log('[ValuesAcceptance] SUCCESS! User should now navigate to home');
    } catch (error) {
      console.error('[ValuesAcceptance] ERROR:', error);
      const message = apiService.handleError(error);
      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>{t('values.title')}</Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Surface style={styles.valuesContainer}>
          <Text style={styles.valueText}>{t('values.value1')}</Text>
          <Text style={styles.valueText}>{t('values.value2')}</Text>
          <Text style={styles.valueText}>{t('values.value3')}</Text>
          <Text style={styles.valueText}>{t('values.value4')}</Text>
          <Text style={styles.valueText}>{t('values.value5')}</Text>
          <Text style={styles.valueText}>{t('values.value6')}</Text>
          
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimer}>{t('legal.disclaimer')}</Text>
          </View>

          <View style={styles.checkboxContainer}>
            <Checkbox
              status={agreed ? 'checked' : 'unchecked'}
              onPress={() => {
                const newValue = !agreed;
                console.log('[ValuesAcceptance] Checkbox toggled to:', newValue);
                setAgreed(newValue);
              }}
            />
            <Text style={styles.checkboxLabel}>{t('values.accept')}</Text>
          </View>

          <Button
            mode="contained"
            onPress={handleAccept}
            loading={loading}
            disabled={loading || !agreed}
            style={styles.acceptButton}
            contentStyle={styles.buttonContent}
          >
            {t('common.continue')}
          </Button>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  valuesContainer: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  valueText: {
    fontSize: 13,
    color: '#1A1A1A',
    marginBottom: 10,
    lineHeight: 18,
  },
  disclaimerContainer: {
    marginTop: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
  },
  disclaimer: {
    fontSize: 11,
    color: '#856404',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 8,
    flex: 1,
  },
  acceptButton: {
    borderRadius: 8,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 10,
  },
});

export default ValuesAcceptanceScreen;
