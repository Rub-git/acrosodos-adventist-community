import { Alert, Platform } from 'react-native';

interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Cross-platform alert function that works on iOS, Android, and Web
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS === 'web') {
    // For web, use window.alert or window.confirm
    const messageText = message ? `${title}\n\n${message}` : title;
    
    if (buttons && buttons.length > 1) {
      // If there are multiple buttons, use confirm dialog
      const result = window.confirm(messageText);
      const primaryButton = buttons.find(b => b.style !== 'cancel') ?? buttons[0];
      const cancelButton = buttons.find(b => b.style === 'cancel');
      
      if (result && primaryButton?.onPress) {
        primaryButton.onPress();
      } else if (!result && cancelButton?.onPress) {
        cancelButton.onPress();
      }
    } else {
      // Single button or no buttons, use simple alert
      window.alert(messageText);
      if (buttons?.[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    // For iOS and Android, use native Alert
    Alert.alert(title, message, buttons);
  }
}
