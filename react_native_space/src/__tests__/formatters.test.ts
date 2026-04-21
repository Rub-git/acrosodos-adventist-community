import { formatTimestamp, formatDuration, formatFileSize } from '../utils/formatters';

describe('Formatter Utils', () => {
  describe('formatTimestamp', () => {
    it('should format recent timestamps', () => {
      const now = new Date();
      const result = formatTimestamp(now.toISOString());
      expect(result).toBe('Just now');
    });

    it('should format minutes ago', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000);
      const result = formatTimestamp(date.toISOString());
      expect(result).toBe('30m ago');
    });

    it('should handle invalid timestamps', () => {
      const result = formatTimestamp('invalid');
      expect(result).toBe('');
    });
  });

  describe('formatDuration', () => {
    it('should format duration in mm:ss format', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(3661)).toBe('61:01');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(5120)).toBe('5.0 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
    });
  });
});
