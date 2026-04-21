import { validateEmail, validatePassword, validateVideoFile, validateAudioFile, validateImageFile } from '../utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate passwords with at least 8 characters', () => {
      expect(validatePassword('12345678')).toBe(true);
      expect(validatePassword('password123')).toBe(true);
    });

    it('should reject passwords shorter than 8 characters', () => {
      expect(validatePassword('1234567')).toBe(false);
      expect(validatePassword('pass')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validateVideoFile', () => {
    it('should accept valid video files', () => {
      const result = validateVideoFile({ size: 30 * 1024 * 1024, duration: 60 });
      expect(result.valid).toBe(true);
    });

    it('should reject video files exceeding size limit', () => {
      const result = validateVideoFile({ size: 60 * 1024 * 1024, duration: 60 });
      expect(result.valid).toBe(false);
      expect(result?.error).toContain('50MB');
    });

    it('should reject video files exceeding duration limit', () => {
      const result = validateVideoFile({ size: 30 * 1024 * 1024, duration: 100 });
      expect(result.valid).toBe(false);
      expect(result?.error).toContain('90 seconds');
    });
  });

  describe('validateAudioFile', () => {
    it('should accept valid audio files', () => {
      const result = validateAudioFile({ size: 10 * 1024 * 1024, duration: 60 });
      expect(result.valid).toBe(true);
    });

    it('should reject audio files exceeding size limit', () => {
      const result = validateAudioFile({ size: 25 * 1024 * 1024, duration: 60 });
      expect(result.valid).toBe(false);
      expect(result?.error).toContain('20MB');
    });
  });

  describe('validateImageFile', () => {
    it('should accept valid image files', () => {
      const result = validateImageFile({ size: 3 * 1024 * 1024 });
      expect(result.valid).toBe(true);
    });

    it('should reject image files exceeding size limit', () => {
      const result = validateImageFile({ size: 6 * 1024 * 1024 });
      expect(result.valid).toBe(false);
      expect(result?.error).toContain('5MB');
    });
  });
});
