import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, Platform } from 'react-native';
import { Appbar, Divider, Button, List, Portal, Dialog } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import * as ImagePicker from 'expo-image-picker';
import apiService from '../../services/api';
import { validateImageFile } from '../../utils/validation';
import { RootStackParamList } from '../../types';

type ProfileNavigationProp = StackNavigationProp<RootStackParamList>;

// Cross-platform alert
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, logout, refreshUser } = useAuth();
  const { t } = useLocalization();
  const [uploading, setUploading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleUploadPhoto = async () => {
    try {
      const isWeb = Platform.OS === 'web';
      
      if (isWeb) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (!file) return;
          
          const validation = validateImageFile({ size: file.size });
          if (!validation.valid) {
            showAlert(t('common.error'), validation?.error ?? 'Invalid file');
            return;
          }
          
          setUploading(true);
          try {
            const formData = new FormData();
            formData.append('file', file);
            await apiService.getAxiosInstance().post('/users/profile-picture', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            await refreshUser();
            showAlert(t('common.success'), 'Profile picture updated');
          } catch (error: any) {
            showAlert(t('common.error'), error?.response?.data?.message || 'Failed to upload');
          } finally {
            setUploading(false);
          }
        };
        input.click();
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Please enable photo library access');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result?.assets?.[0]) {
          const asset = result.assets[0];
          setUploading(true);
          try {
            const formData = new FormData();
            const filename = asset?.uri?.split('/')?.pop() ?? 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            formData.append('file', { uri: asset.uri, name: filename, type } as any);
            await apiService.getAxiosInstance().post('/users/profile-picture', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            await refreshUser();
            Alert.alert(t('common.success'), 'Profile picture updated');
          } catch (error: any) {
            Alert.alert(t('common.error'), error?.response?.data?.message || 'Failed to upload');
          } finally {
            setUploading(false);
          }
        }
      }
    } catch (error: any) {
      showAlert(t('common.error'), apiService.handleError(error));
    }
  };

  const handleLogout = () => {
    console.log('=== LOGOUT BUTTON CLICKED ===' );
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    console.log('=== LOGOUT CONFIRMED ===' );
    setShowLogoutDialog(false);
    logout();
  };

  const cancelLogout = () => {
    setShowLogoutDialog(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.Content title={t('profile.title')} />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.profilepictureurl ? (
              <Image source={{ uri: user.profilepictureurl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{user?.name ?? ''}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
          
          <Button 
            mode="outlined" 
            onPress={handleUploadPhoto} 
            loading={uploading}
            disabled={uploading}
            style={styles.uploadButton}
          >
            {t('profile.uploadPhoto')}
          </Button>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <Divider style={styles.divider} />
          {user?.localchurch && <View style={styles.infoRow}><Text style={styles.infoLabel}>{t('profile.localChurch')}</Text><Text style={styles.infoValue}>{user.localchurch}</Text></View>}
          {user?.ministry && <View style={styles.infoRow}><Text style={styles.infoLabel}>{t('profile.ministry')}</Text><Text style={styles.infoValue}>{user.ministry}</Text></View>}
          {user?.country && <View style={styles.infoRow}><Text style={styles.infoLabel}>{t('profile.country')}</Text><Text style={styles.infoValue}>{user.country}</Text></View>}
          <View style={styles.infoRow}><Text style={styles.infoLabel}>{t('profile.language')}</Text><Text style={styles.infoValue}>{user?.preferredlanguage === 'en' ? 'English' : 'Español'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>{t('profile.timezone')}</Text><Text style={styles.infoValue}>{user?.timezone ?? ''}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.disclaimer}>{t('legal.disclaimer')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('legal.sectionTitle')}</Text>
          <Divider style={styles.divider} />
          
          <List.Item
            title={t('legal.termsAndConditions.title')}
            left={props => <List.Icon {...props} icon="file-document" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('TermsAndConditions')}
            style={styles.listItem}
          />
          <List.Item
            title={t('legal.privacyPolicy.title')}
            left={props => <List.Icon {...props} icon="lock" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            style={styles.listItem}
          />
          <List.Item
            title={t('legal.communityGuidelines.title')}
            left={props => <List.Icon {...props} icon="account-group" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('CommunityGuidelines')}
            style={styles.listItem}
          />
        </View>

        <Button 
          mode="contained" 
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          labelStyle={styles.logoutButtonLabel}
          buttonColor="#D32F2F"
        >
          {t('auth.logout')}
        </Button>
      </ScrollView>

      <Portal>
        <Dialog visible={showLogoutDialog} onDismiss={cancelLogout} style={styles.dialog}>
          <Dialog.Title>{t('auth.logout')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('common.confirmLogout')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelLogout}>{t('common.cancel')}</Button>
            <Button onPress={confirmLogout} textColor="#D32F2F">{t('auth.logout')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  content: { flex: 1 },
  profileHeader: {
    padding: 24,
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: { marginBottom: 16 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#FFFFFF' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  email: { fontSize: 16, color: '#666', marginBottom: 16 },
  uploadButton: { marginTop: 8 },
  section: {
    padding: 20,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 12 },
  divider: { marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#1A1A1A' },
  disclaimer: { fontSize: 12, color: '#666', fontStyle: 'italic', lineHeight: 18 },
  listItem: { paddingVertical: 4 },
  logoutButton: { margin: 16, marginTop: 24, marginBottom: 32 },
  logoutButtonContent: { paddingVertical: 8 },
  logoutButtonLabel: { fontSize: 18, fontWeight: '700' },
  dialog: { maxWidth: 400, alignSelf: 'center' },
});

export default ProfileScreen;
