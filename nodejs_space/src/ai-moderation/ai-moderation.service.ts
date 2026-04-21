import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ModerationResult {
  approved: boolean;
  flagged: boolean;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

@Injectable()
export class AiModerationService {
  private readonly logger = new Logger(AiModerationService.name);
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ABACUSAI_API_KEY') || '';
  }

  async moderateContent(content: string, contentType: 'post' | 'comment'): Promise<ModerationResult> {
    try {
      const prompt = this.buildModerationPrompt(content, contentType);

      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a compassionate content moderator for a Seventh-day Adventist faith community. Analyze content for appropriateness and respond in JSON format.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI moderation API failed: ${response.statusText}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      this.logger.log(`AI moderation completed: ${result.approved ? 'approved' : 'flagged'}`);

      return {
        approved: result.approved || false,
        flagged: result.flagged || false,
        reason: result.reason || '',
        severity: result.severity || 'LOW',
      };
    } catch (error) {
      this.logger.error(`AI moderation failed: ${error.message}`, error.stack);
      // Default to manual review if AI fails
      return {
        approved: false,
        flagged: true,
        reason: 'AI moderation service unavailable - requires manual review',
        severity: 'MEDIUM',
      };
    }
  }

  private buildModerationPrompt(content: string, contentType: string): string {
    return `
Analyze this ${contentType} from a Seventh-day Adventist community platform. Evaluate for:

1. **Offensive/Harmful Content**: Profanity, hate speech, violence, discrimination
2. **Inappropriate Content**: Sexual content, promotion of harmful substances, divisive theological claims
3. **Medical/Legal Advice**: Unqualified medical, psychological, or legal advice
4. **False Authority**: Claims of healing power or prophetic authority
5. **Safety Concerns**: Personal information sharing, unsafe activities

Content to moderate:
"${content}"

Provide a JSON response with:
- approved (boolean): true if content is appropriate
- flagged (boolean): true if requires human review
- reason (string): Brief explanation in pastoral, compassionate tone
- severity (string): LOW, MEDIUM, or HIGH

Be gracious and assume good intent. The community values faith, kindness, and mutual support.
`;
  }
}
