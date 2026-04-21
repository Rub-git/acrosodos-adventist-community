export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password?.length >= 8;
};

export const validateVideoFile = (file: { size: number; duration?: number }): { valid: boolean; error?: string } => {
  // REDUCED: 15 MB limit for better upload reliability through web preview
  // Cloudflare has aggressive timeouts on uploads >10 MB
  const maxSize = 15 * 1024 * 1024; // 15MB
  const maxDuration = 90; // 90 seconds

  if ((file?.size ?? 0) > maxSize) {
    const sizeMB = ((file?.size ?? 0) / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      error: `Video size (${sizeMB} MB) exceeds 15 MB limit. Please use a shorter/lower quality video, or use the mobile app for larger files.` 
    };
  }

  if ((file?.duration ?? 0) > maxDuration) {
    return { valid: false, error: 'Video duration exceeds 90 seconds limit' };
  }

  return { valid: true };
};

export const validateAudioFile = (file: { size: number; duration?: number }): { valid: boolean; error?: string } => {
  const maxSize = 20 * 1024 * 1024; // 20MB
  const maxDuration = 90; // 90 seconds

  if ((file?.size ?? 0) > maxSize) {
    return { valid: false, error: 'Audio size exceeds 20MB limit' };
  }

  if ((file?.duration ?? 0) > maxDuration) {
    return { valid: false, error: 'Audio duration exceeds 90 seconds limit' };
  }

  return { valid: true };
};

export const validateImageFile = (file: { size: number }): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB

  if ((file?.size ?? 0) > maxSize) {
    return { valid: false, error: 'Image size exceeds 5MB limit' };
  }

  return { valid: true };
};
