import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, Menu } from 'react-native-paper';
import { useLocalization } from '../contexts/LocalizationContext';
import apiService from '../services/api';

interface ReportModalProps {
  visible: boolean;
  onDismiss: () => void;
  contentId: string;
  contentType: 'post' | 'comment';
}

const ReportModal: React.FC<ReportModalProps> = ({ visible, onDismiss, contentId, contentType }) => {
  const { t } = useLocalization();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const reasons = [
    { key: 'offensive', label: t('report.reasons.offensive') },
    { key: 'harmful', label: t('report.reasons.harmful') },
    { key: 'inappropriate', label: t('report.reasons.inappropriate') },
    { key: 'spam', label: t('report.reasons.spam') },
    { key: 'other', label: t('report.reasons.other') },
  ];

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert(t('common.error'), 'Please select a reason');
      return;
    }

    try {
      setLoading(true);
      const endpoint = contentType === 'post' ? `/posts/${contentId}/report` : `/comments/${contentId}/report`;
      await apiService.getAxiosInstance().post(endpoint, {
        reason,
        description: description || undefined,
      });
      Alert.alert(t('common.success'), 'Report submitted successfully');
      handleClose();
    } catch (error) {
      Alert.alert(t('common.error'), apiService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setDescription('');
    onDismiss();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleClose} contentContainerStyle={styles.modal}>
        <Text style={styles.title}>{t('report.title')}</Text>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              style={styles.input}
            >
              {reason ? reasons?.find((r) => r?.key === reason)?.label : t('report.reason')}
            </Button>
          }
        >
          {reasons?.map((r) => (
            <Menu.Item
              key={r?.key}
              onPress={() => {
                setReason(r?.key ?? '');
                setMenuVisible(false);
              }}
              title={r?.label ?? ''}
            />
          )) ?? []}
        </Menu>

        <TextInput
          mode="outlined"
          label={t('report.description')}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <View style={styles.actions}>
          <Button onPress={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading || !reason}>
            {t('report.submit')}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  input: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});

export default ReportModal;
