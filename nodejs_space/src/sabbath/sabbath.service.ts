import { Injectable, Logger } from '@nestjs/common';
import * as SunCalc from 'suncalc';

export interface SabbathStatus {
  isSabbath: boolean;
  sabbathStart: string;
  sabbathEnd: string;
}

@Injectable()
export class SabbathService {
  private readonly logger = new Logger(SabbathService.name);

  // Approximate coordinates for timezone centers (for sunset calculation)
  private readonly timezoneCoordinates: Record<string, { lat: number; lng: number }> = {
    'America/New_York': { lat: 40.7128, lng: -74.0060 },
    'America/Chicago': { lat: 41.8781, lng: -87.6298 },
    'America/Denver': { lat: 39.7392, lng: -104.9903 },
    'America/Los_Angeles': { lat: 34.0522, lng: -118.2437 },
    'America/Phoenix': { lat: 33.4484, lng: -112.0740 },
    'America/Anchorage': { lat: 61.2181, lng: -149.9003 },
    'Pacific/Honolulu': { lat: 21.3099, lng: -157.8581 },
    'Europe/London': { lat: 51.5074, lng: -0.1278 },
    'Europe/Paris': { lat: 48.8566, lng: 2.3522 },
    'Asia/Tokyo': { lat: 35.6762, lng: 139.6503 },
    'Australia/Sydney': { lat: -33.8688, lng: 151.2093 },
  };

  getSabbathStatus(timezone: string): SabbathStatus {
    try {
      const now = new Date();
      const { sabbathStart, sabbathEnd } = this.calculateSabbathTimes(timezone, now);

      const isSabbath = now >= sabbathStart && now <= sabbathEnd;

      this.logger.log(`Sabbath status for ${timezone}: ${isSabbath ? 'active' : 'inactive'}`);

      return {
        isSabbath,
        sabbathStart: sabbathStart.toISOString(),
        sabbathEnd: sabbathEnd.toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to calculate Sabbath status: ${error.message}`, error.stack);
      // Default to not in Sabbath if calculation fails
      return {
        isSabbath: false,
        sabbathStart: new Date().toISOString(),
        sabbathEnd: new Date().toISOString(),
      };
    }
  }

  private calculateSabbathTimes(timezone: string, referenceDate: Date): { sabbathStart: Date; sabbathEnd: Date } {
    // Get coordinates for the timezone (fallback to New York if not found)
    const coords = this.timezoneCoordinates[timezone] || this.timezoneCoordinates['America/New_York'];

    // Calculate current week's Friday and Saturday
    const currentDay = referenceDate.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    
    // Calculate days until Friday
    let daysUntilFriday = (5 - currentDay + 7) % 7;
    if (currentDay === 5 || currentDay === 6) {
      // If today is Friday or Saturday, check if we're past this week's Sabbath
      const thisFriday = new Date(referenceDate);
      thisFriday.setDate(referenceDate.getDate() - (currentDay - 5));
      thisFriday.setHours(0, 0, 0, 0);
      
      const sunsetFriday = SunCalc.getTimes(thisFriday, coords.lat, coords.lng).sunset;
      
      if (referenceDate > sunsetFriday) {
        // We're in current Sabbath or past it
        const thisSaturday = new Date(thisFriday);
        thisSaturday.setDate(thisFriday.getDate() + 1);
        const sunsetSaturday = SunCalc.getTimes(thisSaturday, coords.lat, coords.lng).sunset;
        
        if (referenceDate <= sunsetSaturday) {
          // Currently in Sabbath
          return {
            sabbathStart: sunsetFriday,
            sabbathEnd: sunsetSaturday,
          };
        } else {
          // Past this week's Sabbath, calculate next week
          daysUntilFriday = 7 - (currentDay - 5);
        }
      } else {
        // Before this week's Sabbath starts
        daysUntilFriday = 0;
      }
    }
    
    // Calculate upcoming/current Friday
    const friday = new Date(referenceDate);
    friday.setDate(referenceDate.getDate() + daysUntilFriday);
    friday.setHours(0, 0, 0, 0);

    // Calculate Saturday
    const saturday = new Date(friday);
    saturday.setDate(friday.getDate() + 1);

    // Get sunset times
    const sunsetFriday = SunCalc.getTimes(friday, coords.lat, coords.lng).sunset;
    const sunsetSaturday = SunCalc.getTimes(saturday, coords.lat, coords.lng).sunset;

    return {
      sabbathStart: sunsetFriday,
      sabbathEnd: sunsetSaturday,
    };
  }
}
