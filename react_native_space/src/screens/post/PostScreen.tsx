import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, Image } from 'react-native';
import { Appbar, Button, TextInput, SegmentedButtons, Menu } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video } from 'expo-av';
import { ContentType, PostCategory, Language } from '../../types';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import { validateVideoFile, validateAudioFile, validateImageFile } from '../../utils/validation';
import axios from 'axios';

const PostScreen: React.FC = () => {
  // Version marker for cache debugging
  console.log('📦 [PostScreen] VERSION: 2026-02-03-v12-reduced-limits');
  
  const { t } = useLocalization();
  const { user } = useAuth();
  const [contentType, setContentType] = useState<ContentType>(ContentType.TEXT);
  const [category, setCategory] = useState<PostCategory>(PostCategory.GENERAL_ENCOURAGEMENT);
  const [textContent, setTextContent] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null); // Store original File object for web
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  const categories = [
    { key: PostCategory.PRAYER_REQUEST, label: t('categories.PRAYER_REQUEST') },
    { key: PostCategory.TESTIMONY, label: t('categories.TESTIMONY') },
    { key: PostCategory.BIBLICAL_REFLECTION, label: t('categories.BIBLICAL_REFLECTION') },
    { key: PostCategory.SABBATH_ACTIVITY, label: t('categories.SABBATH_ACTIVITY') },
    { key: PostCategory.GENERAL_ENCOURAGEMENT, label: t('categories.GENERAL_ENCOURAGEMENT') },
  ];

  const handleSelectMedia = async () => {
    try {
      // Check if we're in a browser (web) regardless of device
      const isWeb = typeof document !== 'undefined' && typeof window !== 'undefined';
      
      if (isWeb && contentType === ContentType.AUDIO) {
        // For audio on web, use file input with specific audio MIME types
        const input = document.createElement('input');
        input.type = 'file';
        // Use specific MIME types to avoid showing video options on iOS
        input.accept = '.mp3,.m4a,.wav,.aac,.ogg,.opus,audio/mpeg,audio/mp4,audio/wav,audio/aac,audio/ogg';
        
        input.onchange = (e: any) => {
          const file = e?.target?.files?.[0];
          if (file) {
            const validation = validateAudioFile({
              size: file?.size ?? 0,
              duration: 0,
            });
            
            if (!validation.valid) {
              Alert.alert(t('common.error'), validation?.error ?? 'Invalid file');
              return;
            }
            
            const uri = URL.createObjectURL(file);
            setMediaUri(uri);
          }
        };
        
        input.click();
        return;
      }

      // Native app or ImagePicker available
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please enable photo library access');
        return;
      }

      const mediaTypes = 
        contentType === ContentType.VIDEO ? ImagePicker.MediaTypeOptions.Videos :
        contentType === ContentType.IMAGE ? ImagePicker.MediaTypeOptions.Images :
        ImagePicker.MediaTypeOptions.All;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: contentType === ContentType.IMAGE, // Allow cropping for images
        aspect: contentType === ContentType.IMAGE ? [4, 3] : undefined,
        quality: contentType === ContentType.IMAGE ? 0.8 : 1,
      });

      if (!result.canceled && result?.assets?.[0]) {
        const asset = result.assets[0];
        
        if (contentType === ContentType.VIDEO) {
          const validation = validateVideoFile({
            size: asset?.fileSize ?? 0,
            duration: asset?.duration ?? 0,
          });
          if (!validation.valid) {
            Alert.alert(t('common.error'), validation?.error ?? 'Invalid file');
            return;
          }
        } else if (contentType === ContentType.IMAGE) {
          const validation = validateImageFile({
            size: asset?.fileSize ?? 0,
          });
          if (!validation.valid) {
            Alert.alert(t('common.error'), validation?.error ?? 'Invalid file');
            return;
          }
        }

        setMediaUri(asset?.uri ?? null);
      }
    } catch (error) {
      console.error('[PostScreen] handleSelectMedia error:', error);
      Alert.alert(t('common.error'), 'Failed to select media');
    }
  };

  const handleRecordVideo = async () => {
    try {
      console.log('[handleRecordVideo] Starting...');
      // Check if we're in a browser (web) regardless of device
      const isWeb = typeof document !== 'undefined' && typeof window !== 'undefined';
      console.log('[handleRecordVideo] Environment:', { isWeb });
      
      if (isWeb) {
        // For web browsers (desktop and mobile), use file input
        console.log('[handleRecordVideo] Creating file input for video...');
        const input = document.createElement('input');
        input.type = 'file';
        // Only accept MP4 and MOV (QuickTime) - these work in browsers
        // DO NOT accept AVI (video/x-msvideo) - browsers cannot play it
        input.accept = 'video/mp4,video/quicktime,.mp4,.mov';
        input.style.display = 'none';
        
        // Remove capture attribute for desktop browsers
        // input.capture = 'environment';
        
        input.onchange = (e: any) => {
          console.log('[handleRecordVideo] File input changed');
          const file = e?.target?.files?.[0];
          console.log('[handleRecordVideo] File selected:', {
            name: file?.name,
            size: file?.size,
            type: file?.type,
          });
          
          if (file) {
            // Check file type - reject AVI and other unsupported formats
            const fileType = file.type.toLowerCase();
            const fileName = file.name.toLowerCase();
            
            if (fileName.endsWith('.avi') || fileType.includes('x-msvideo')) {
              console.error('[handleRecordVideo] AVI format not supported');
              Alert.alert(
                t('common.error'), 
                'AVI format is not supported. Please use MP4 or MOV format.\n\nYou can convert your video using a free tool like HandBrake or CloudConvert.'
              );
              return;
            }
            
            if (!fileType.includes('mp4') && !fileType.includes('quicktime') && !fileName.endsWith('.mp4') && !fileName.endsWith('.mov')) {
              console.error('[handleRecordVideo] Unsupported format:', fileType, fileName);
              Alert.alert(
                t('common.error'), 
                'Unsupported video format. Please use MP4 or MOV format.'
              );
              return;
            }
            
            const validation = validateVideoFile({
              size: file?.size ?? 0,
              duration: 0, // Can't check duration from file input easily
            });
            console.log('[handleRecordVideo] Validation result:', validation);
            
            if (!validation.valid) {
              console.error('[handleRecordVideo] Validation failed:', validation.error);
              Alert.alert(t('common.error'), validation?.error ?? 'Invalid file');
              return;
            }
            
            try {
              const uri = URL.createObjectURL(file);
              console.log('[handleRecordVideo] Video URI created:', uri.substring(0, 50));
              setMediaUri(uri);
              setMediaFile(file); // Store the original File object
              console.log('[handleRecordVideo] Media URI and File set successfully');
            } catch (blobError) {
              console.error('[handleRecordVideo] Error creating blob URL:', blobError);
              Alert.alert(t('common.error'), 'Failed to load video preview');
            }
          } else {
            console.log('[handleRecordVideo] No file selected');
          }
          
          // Clean up
          document.body.removeChild(input);
        };
        
        // Append to body and trigger click
        document.body.appendChild(input);
        input.click();
        console.log('[handleRecordVideo] File input clicked');
      } else {
        // Native Expo Go app: use camera
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Please enable camera access');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: false,
          quality: 1,
          videoMaxDuration: 90,
        });

        if (!result.canceled && result?.assets?.[0]) {
          setMediaUri(result?.assets?.[0]?.uri ?? null);
        }
      }
    } catch (error) {
      console.error('[PostScreen] handleRecordVideo error:', error);
      Alert.alert(t('common.error'), 'Failed to record video');
    }
  };

  const handlePublish = async () => {
    console.log('='.repeat(80));
    console.log('🚀 [handlePublish] PUBLISH BUTTON CLICKED! Starting publish process...');
    console.log('[handlePublish] State:', { 
      contentType, 
      hasMediaUri: !!mediaUri, 
      hasMediaFile: !!mediaFile,
      mediaFileSize: mediaFile?.size,
      mediaFileName: mediaFile?.name,
      textLength: textContent.length 
    });
    console.log('='.repeat(80));

    if (contentType === ContentType.TEXT && !textContent.trim()) {
      Alert.alert(t('common.error'), 'Please write something');
      return;
    }

    if ((contentType === ContentType.VIDEO || contentType === ContentType.AUDIO || contentType === ContentType.IMAGE) && !mediaUri) {
      Alert.alert(t('common.error'), 'Please select media');
      return;
    }

    try {
      setLoading(true);
      setUploadStatus('');
      console.log('[handlePublish] Loading set to true');
      
      let mediaUrl = undefined;
      
      // Upload media if needed
      if (contentType === ContentType.VIDEO || contentType === ContentType.AUDIO || contentType === ContentType.IMAGE) {
        console.log('[handlePublish] Starting media upload...');
        const mediaType = 
          contentType === ContentType.VIDEO ? 'video' :
          contentType === ContentType.IMAGE ? 'image' : 'audio';
        setUploadStatus(`Uploading ${mediaType}... Please wait`);
        
        try {
          mediaUrl = await uploadMedia(mediaUri, contentType);
          console.log('[handlePublish] Media uploaded:', mediaUrl);
          
          // Verify mediaUrl is valid
          if (!mediaUrl || mediaUrl.trim() === '') {
            console.error('[handlePublish] ERROR: mediaUrl is empty!');
            setUploadStatus('');
            throw new Error('Upload failed: No file URL returned from server');
          }
          
          console.log('[handlePublish] Valid mediaUrl received:', mediaUrl);
          setUploadStatus('Upload complete! Creating post...');
        } catch (uploadError: any) {
          console.error('[handlePublish] Upload ERROR:', uploadError);
          console.error('[handlePublish] Error details:', {
            name: uploadError?.name,
            message: uploadError?.message,
            stack: uploadError?.stack?.substring(0, 200)
          });
          setUploadStatus('');
          
          // Show detailed error to user
          const errorMsg = uploadError?.message || 'Failed to upload media. Please check your internet connection and try again.';
          Alert.alert('Upload Error', `Could not upload ${mediaType}:\n\n${errorMsg}\n\nPlease check the browser console (F12) for more details.`);
          
          throw new Error(errorMsg);
        }
      }
      
      // Create the post
      console.log('[handlePublish] ========== CREATING POST ==========');
      console.log('[handlePublish] mediaUrl type:', typeof mediaUrl);
      console.log('[handlePublish] mediaUrl value:', mediaUrl);
      console.log('[handlePublish] mediaUrl length:', mediaUrl?.length);
      console.log('[handlePublish] Post payload:', {
        contentType,
        category,
        textContent: textContent || undefined,
        mediaUrl,
        language: user?.preferredlanguage ?? Language.en,
      });
      
      setUploadStatus('Creating post...');
      
      try {
        const createPostResponse = await apiService.getAxiosInstance().post('/posts', {
          contentType,
          category,
          textContent: textContent || undefined,
          mediaUrl,
          language: user?.preferredlanguage ?? Language.en,
        });
        
        console.log('[handlePublish] Post created successfully! Response:', createPostResponse?.data);
      } catch (createPostError: any) {
        console.error('[handlePublish] ERROR creating post:', createPostError);
        console.error('[handlePublish] Create post error response:', createPostError?.response?.data);
        console.error('[handlePublish] Create post error status:', createPostError?.response?.status);
        throw new Error(`Failed to create post: ${createPostError?.response?.data?.message || createPostError?.message || 'Unknown error'}`);
      }

      console.log('[handlePublish] Post created successfully');
      setUploadStatus('');
      Alert.alert(t('common.success'), 'Post created successfully! Check your Home feed.');
      setTextContent('');
      setMediaUri(null);
      setMediaFile(null);
    } catch (error: any) {
      console.error('[handlePublish] FINAL ERROR CATCH:', error);
      console.error('[handlePublish] Error details:', {
        message: error?.message,
        name: error?.name,
        type: typeof error
      });
      
      const errorMessage = error?.message || apiService.handleError(error);
      setUploadStatus('');
      
      // Always show error alert
      console.log('[handlePublish] Showing error alert:', errorMessage);
      Alert.alert(
        t('common.error'), 
        errorMessage,
        [{ text: 'OK', onPress: () => console.log('[handlePublish] Error alert dismissed') }]
      );
    } finally {
      setLoading(false);
      setUploadStatus('');
      console.log('[handlePublish] Finally block - Loading and uploadStatus cleared');
    }
  };

  const uploadMedia = async (uri: string | null, type: ContentType): Promise<string | undefined> => {
    if (!uri) {
      console.log('[uploadMedia] No URI provided');
      return undefined;
    }

    console.log('[uploadMedia] Starting upload:', { uri: uri.substring(0, 50), type });

    try {
      const formData = new FormData();
      
      // Check if we're in a browser environment
      const isWeb = typeof document !== 'undefined' && typeof window !== 'undefined';
      console.log('[uploadMedia] Environment:', { isWeb });
      
      if (isWeb) {
        // Web: Use the original File object directly (NO fetch, NO blob conversion)
        if (mediaFile) {
          console.log('[uploadMedia] Using original File object:', {
            name: mediaFile.name,
            size: mediaFile.size,
            type: mediaFile.type
          });
          
          // Get extension from the original filename (more reliable than MIME type)
          const originalExtension = mediaFile.name.split('.').pop()?.toLowerCase() || '';
          console.log('[uploadMedia] Original file extension:', originalExtension);
          
          // Normalize file extension
          let extension = originalExtension;
          if (type === ContentType.IMAGE) {
            // Image extensions
            if (extension === 'jpeg') extension = 'jpg';
            // Keep other extensions as is: jpg, png, gif, webp
          } else if (extension === 'm4a' || (extension === 'mp4' && type === ContentType.AUDIO)) {
            extension = 'm4a';
          } else if (extension === 'mov' || extension === 'quicktime') {
            extension = 'mov';
          } else if (extension === 'mp4') {
            extension = 'mp4';
          }
          
          console.log('[uploadMedia] Normalized extension:', extension);
          const filename = `${type.toLowerCase()}_${Date.now()}.${extension}`;
          // Use the File object directly - NO blob conversion needed!
          formData.append('file', mediaFile, filename);
          console.log('[uploadMedia] File appended to FormData directly:', { filename, size: mediaFile.size, type: mediaFile.type, originalName: mediaFile.name });
        } else {
          // Fallback: Convert blob URL to file (old method - less reliable)
          console.log('[uploadMedia] WARNING: mediaFile is null, using fallback blob conversion...');
          console.log('[uploadMedia] Fetching blob from URI...');
          const response = await fetch(uri);
          const blob = await response.blob();
          console.log('[uploadMedia] Blob fetched:', { size: blob.size, type: blob.type });
          
          // Map MIME types to correct file extensions
          let extension = 'mp4'; // default
          const mimeType = blob.type.toLowerCase();
          
          if (mimeType.includes('mp4') || mimeType.includes('mpeg4')) {
            extension = 'mp4';
          } else if (mimeType.includes('quicktime')) {
            extension = 'mov';
          } else if (mimeType.includes('webm')) {
            extension = 'webm';
          } else if (mimeType.includes('ogg')) {
            extension = 'ogg';
          } else if (mimeType.includes('m4a') || (mimeType.includes('mp4') && type === ContentType.AUDIO)) {
            extension = 'm4a';
          } else if (mimeType.includes('mpeg') && type === ContentType.AUDIO) {
            extension = 'mp3';
          } else if (mimeType.includes('wav')) {
            extension = 'wav';
          }
          
          console.log('[uploadMedia] Mapped MIME type to extension:', { mimeType, extension });
          const filename = `${type.toLowerCase()}_${Date.now()}.${extension}`;
          formData.append('file', blob, filename);
          console.log('[uploadMedia] File appended to FormData:', { filename, blobType: blob.type, size: blob.size });
        }
      } else {
        // Native: Use the URI directly
        const filename = uri.split('/').pop() ?? `${type}_${Date.now()}`;
        const fileType = 
          type === ContentType.VIDEO ? 'video/mp4' :
          type === ContentType.IMAGE ? 'image/jpeg' :
          'audio/mp3';
        
        formData.append('file', {
          uri,
          name: filename,
          type: fileType,
        } as any);
        console.log('[uploadMedia] Native file appended:', { filename, fileType });
      }
      
      const mediaType = type.toLowerCase();
      formData.append('mediaType', mediaType);
      console.log('[uploadMedia] MediaType appended:', mediaType);
      
      // Get auth token
      const token = await apiService.getAuthToken();
      console.log('[uploadMedia] Auth token obtained:', token ? 'Yes' : 'No');
      
      // Determine backend URL based on current location
      let baseUrl: string;
      const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const currentProtocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
      
      console.log('[uploadMedia] Current location:', { hostname: currentHostname, protocol: currentProtocol });
      
      if (isWeb && currentHostname.includes('preview.abacusai.app')) {
        // We're on preview URL - use the backend preview URL (remove -8081 port suffix)
        const backendHostname = currentHostname.replace('-8081', '');
        baseUrl = `${currentProtocol}//${backendHostname}/`;
        console.log('[uploadMedia] 🌐 Preview mode: Using backend URL:', baseUrl);
      } else if (isWeb && currentHostname === 'localhost') {
        // Local development
        baseUrl = 'http://localhost:3000/';
        console.log('[uploadMedia] 🏠 Local dev: Using localhost:3000');
      } else {
        // Native mobile or fallback
        baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
        if (!baseUrl.endsWith('/')) {
          baseUrl += '/';
        }
        console.log('[uploadMedia] 📱 Native/fallback: Using env URL:', baseUrl);
      }
      
      const uploadUrl = `${baseUrl}media/upload`;
      console.log('[uploadMedia] 🎯 Final upload URL:', uploadUrl);
      
      // Use axios for upload with custom timeout
      // Note: Web preview through Cloudflare may have limits - use mobile app for large files
      const UPLOAD_TIMEOUT_MS = 90000; // 90 seconds (increased from 2 min to give better error message)
      
      try {
        console.log('[uploadMedia] 📤 About to upload with axios...');
        console.log('[uploadMedia] Request details:', {
          url: uploadUrl,
          method: 'POST',
          hasAuth: !!token,
          timeout: `${UPLOAD_TIMEOUT_MS/1000} seconds`,
          formDataKeys: Array.from((formData as any).keys?.() || []),
        });
        
        const uploadResponse = await axios.post(uploadUrl, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type - axios will set it automatically with boundary
          },
          timeout: UPLOAD_TIMEOUT_MS,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = progressEvent.total 
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            console.log(`[uploadMedia] Upload progress: ${percentCompleted}%`);
          },
        });
        
        console.log('[uploadMedia] ✅ Upload completed! Response received.');
        console.log('[uploadMedia] Response status:', uploadResponse.status);
        console.log('[uploadMedia] Response data:', uploadResponse.data);
        
        const uploadResult = uploadResponse?.data;
        console.log('[uploadMedia] 🎉 Upload success! File URL:', uploadResult?.fileUrl);
        return uploadResult?.fileUrl ?? undefined;
        
      } catch (uploadError: any) {
        console.error('[uploadMedia] ❌ Upload error caught:', uploadError);
        console.error('[uploadMedia] Error name:', uploadError?.name);
        console.error('[uploadMedia] Error message:', uploadError?.message);
        console.error('[uploadMedia] Error code:', uploadError?.code);
        console.error('[uploadMedia] Error response status:', uploadError?.response?.status);
        console.error('[uploadMedia] Error response data:', uploadError?.response?.data);
        
        if (uploadError?.code === 'ECONNABORTED' || uploadError?.message?.includes('timeout')) {
          console.error('[uploadMedia] Upload timeout');
          throw new Error('Upload timed out. Please try:\n• Use a video under 10 MB\n• Compress your video\n• Use the mobile app for larger files');
        }
        
        if (uploadError?.response) {
          // Server responded with error
          const errorMsg = uploadError?.response?.data?.message ?? `Upload failed with status ${uploadError?.response?.status}`;
          console.error('[uploadMedia] Server error:', errorMsg);
          throw new Error(errorMsg);
        }
        
        if (uploadError?.request) {
          // Request was made but no response
          console.error('[uploadMedia] Network error - no response from server');
          throw new Error('Network error: Could not reach server. Please check your internet connection.');
        }
        
        // Something else happened
        console.error('[uploadMedia] Unexpected error');
        throw new Error(uploadError?.message || 'Unknown upload error occurred');
      }
    } catch (error: any) {
      console.error('[uploadMedia] OUTER ERROR CATCH:', error);
      console.error('[uploadMedia] Error type:', typeof error);
      console.error('[uploadMedia] Error message:', error?.message);
      console.error('[uploadMedia] Error stack:', error?.stack?.substring(0, 300));
      throw error;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.Content title={t('post.create')} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>{t('post.selectCategory')}</Text>
        <Menu
          visible={categoryMenuVisible}
          onDismiss={() => setCategoryMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setCategoryMenuVisible(true)}
              style={styles.categoryButton}
            >
              {categories?.find((c) => c?.key === category)?.label ?? ''}
            </Button>
          }
        >
          {categories?.map((cat) => (
            <Menu.Item
              key={cat?.key}
              onPress={() => {
                setCategory(cat?.key ?? PostCategory.GENERAL_ENCOURAGEMENT);
                setCategoryMenuVisible(false);
              }}
              title={cat?.label ?? ''}
            />
          )) ?? []}
        </Menu>

        <Text style={styles.label}>{t('post.selectContentType')}</Text>
        <View style={styles.contentTypeContainer}>
          <View style={styles.contentTypeRow}>
            <Button
              mode={contentType === ContentType.TEXT ? 'contained' : 'outlined'}
              onPress={() => setContentType(ContentType.TEXT)}
              icon="text"
              style={styles.contentTypeButton}
              contentStyle={styles.contentTypeButtonContent}
              labelStyle={styles.contentTypeButtonLabel}
            >
              {t('post.text')}
            </Button>
            <Button
              mode={contentType === ContentType.IMAGE ? 'contained' : 'outlined'}
              onPress={() => setContentType(ContentType.IMAGE)}
              icon="image"
              style={styles.contentTypeButton}
              contentStyle={styles.contentTypeButtonContent}
              labelStyle={styles.contentTypeButtonLabel}
            >
              {t('post.image')}
            </Button>
          </View>
          <View style={styles.contentTypeRow}>
            <Button
              mode={contentType === ContentType.VIDEO ? 'contained' : 'outlined'}
              onPress={() => setContentType(ContentType.VIDEO)}
              icon="video"
              style={styles.contentTypeButton}
              contentStyle={styles.contentTypeButtonContent}
              labelStyle={styles.contentTypeButtonLabel}
            >
              {t('post.video')}
            </Button>
            <Button
              mode={contentType === ContentType.AUDIO ? 'contained' : 'outlined'}
              onPress={() => setContentType(ContentType.AUDIO)}
              icon="microphone"
              style={styles.contentTypeButton}
              contentStyle={styles.contentTypeButtonContent}
              labelStyle={styles.contentTypeButtonLabel}
            >
              {t('post.audio')}
            </Button>
          </View>
        </View>

        {contentType === ContentType.TEXT && (
          <TextInput
            mode="outlined"
            placeholder={t('post.writeYourPost')}
            value={textContent}
            onChangeText={setTextContent}
            multiline
            numberOfLines={8}
            style={styles.textInput}
          />
        )}

        {contentType === ContentType.IMAGE && (
          <View style={styles.mediaActions}>
            <Button
              mode="contained"
              onPress={() => {
                console.log('[PostScreen] Select Image button pressed');
                handleSelectMedia();
              }}
              icon="image"
              style={styles.mediaButton}
            >
              {t('post.selectImage')}
            </Button>
            <Text style={styles.audioHelp}>
              {t('post.selectCategory') === 'Seleccionar Categoría' 
                ? 'Elige una imagen de tu dispositivo (máx 5MB)' 
                : 'Choose an image from your device (max 5MB)'}
            </Text>
            {mediaUri && (
              <View style={styles.videoPreviewContainer}>
                <Image
                  source={{ uri: mediaUri }}
                  style={styles.imagePreview}
                  resizeMode="contain"
                />
                <Text style={styles.mediaSelected}>{t('post.imageSelected')}</Text>
              </View>
            )}
          </View>
        )}

        {contentType === ContentType.VIDEO && (
          <View style={styles.mediaActions}>
            <Button
              mode="contained"
              onPress={() => {
                console.log('[PostScreen] Select Video button pressed');
                handleRecordVideo();
              }}
              icon="folder"
              style={styles.mediaButton}
            >
              Select Video File
            </Button>
            <Text style={styles.audioHelp}>
              Choose a video from your device (max 50MB, 90 seconds)
            </Text>
            {mediaUri && (
              <View style={styles.videoPreviewContainer}>
                <Video
                  source={{ uri: mediaUri }}
                  style={styles.videoPreview}
                  useNativeControls
                  contentFit="contain"
                  shouldPlay={false}
                />
                <Text style={styles.mediaSelected}>{t('post.videoSelected')}</Text>
              </View>
            )}
          </View>
        )}

        {contentType === ContentType.AUDIO && (
          <View style={styles.mediaActions}>
            <Button
              mode="contained"
              onPress={handleSelectMedia}
              icon="folder"
              style={styles.mediaButton}
            >
              Select Audio File
            </Button>
            <Text style={styles.audioHelp}>
              Tip: Use iOS Voice Memos app to record audio, then select it here
            </Text>
            {mediaUri && (
              <Text style={styles.mediaSelected}>{t('post.audioSelected')}</Text>
            )}
          </View>
        )}

        {uploadStatus && (
          <View style={styles.uploadStatusContainer}>
            <Text style={styles.uploadStatusText}>{uploadStatus}</Text>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handlePublish}
          loading={loading}
          disabled={loading}
          style={styles.publishButton}
          contentStyle={styles.buttonContent}
        >
          {loading ? 'Please wait...' : t('post.publish')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 16,
  },
  categoryButton: {
    marginBottom: 16,
  },
  contentTypeContainer: {
    marginBottom: 16,
  },
  contentTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  contentTypeButton: {
    flex: 1,
    borderRadius: 8,
  },
  contentTypeButtonContent: {
    paddingVertical: 8,
  },
  contentTypeButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    marginBottom: 16,
    minHeight: 150,
  },
  mediaActions: {
    marginBottom: 16,
  },
  mediaButton: {
    marginBottom: 12,
  },
  mediaSelected: {
    fontSize: 14,
    color: '#4A90E2',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  videoPreviewContainer: {
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoPreview: {
    width: '100%',
    height: 200,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  audioHelp: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    marginBottom: 8,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  uploadStatusContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  uploadStatusText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  publishButton: {
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default PostScreen;
