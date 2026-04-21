import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { user as User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          name: registerDto.name,
          preferredlanguage: registerDto.preferredLanguage || 'en',
          timezone: registerDto.timezone || 'America/New_York',
          localchurch: registerDto.localChurch,
          ministry: registerDto.ministry,
          country: registerDto.country,
        },
      });

      this.logger.log(`New user registered: ${user.email}`);

      const tokens = await this.generateTokens(user);
      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
      });

      if (!user || !user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is suspended
      if (!user.isactive) {
        const reason = user.suspensionreason || 'violated community guidelines';
        throw new UnauthorizedException(`Your account has been suspended: ${reason}. Please contact support@prospectosdigitales.com for more information.`);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastloginat: new Date() },
      });

      this.logger.log(`User logged in: ${user.email}`);

      const tokens = await this.generateTokens(user);
      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async refreshToken(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async googleAuth(idToken: string) {
    try {
      // Verify Google ID token (in production, use google-auth-library)
      // For now, this is a simplified implementation
      // You should verify the token with Google's API
      const decoded = this.decodeGoogleToken(idToken);

      let user = await this.prisma.user.findUnique({
        where: { googleid: decoded.sub },
      });

      if (!user) {
        user = await this.prisma.user.findUnique({
          where: { email: decoded.email },
        });

        if (user) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { googleid: decoded.sub },
          });
        } else {
          user = await this.prisma.user.create({
            data: {
              email: decoded.email,
              name: decoded.name || decoded.email,
              googleid: decoded.sub,
              profilepictureurl: decoded.picture,
            },
          });
        }
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastloginat: new Date() },
      });

      this.logger.log(`User authenticated via Google: ${user.email}`);

      const tokens = await this.generateTokens(user);
      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      this.logger.error(`Google auth failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async appleAuth(identityToken: string) {
    try {
      // Verify Apple identity token (in production, use proper Apple verification)
      // This is a simplified implementation
      const decoded = this.decodeAppleToken(identityToken);

      let user = await this.prisma.user.findUnique({
        where: { appleid: decoded.sub },
      });

      if (!user) {
        user = await this.prisma.user.findUnique({
          where: { email: decoded.email },
        });

        if (user) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { appleid: decoded.sub },
          });
        } else {
          user = await this.prisma.user.create({
            data: {
              email: decoded.email,
              name: decoded.name || decoded.email,
              appleid: decoded.sub,
            },
          });
        }
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastloginat: new Date() },
      });

      this.logger.log(`User authenticated via Apple: ${user.email}`);

      const tokens = await this.generateTokens(user);
      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      this.logger.error(`Apple auth failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Apple authentication failed');
    }
  }

  async acceptValues(userId: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          hasacceptedvalues: true,
          valuesacceptedat: new Date(),
        },
      });

      this.logger.log(`User accepted values: ${user.email}`);
      return this.sanitizeUser(user);
    } catch (error) {
      this.logger.error(`Accept values failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Use module default config for access token
    const accessToken = await this.jwtService.signAsync(payload);
    
    // For refresh token, override with longer expiration
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default_jwt_refresh_secret',
      expiresIn: '7d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private sanitizeUser(user: User) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  private decodeGoogleToken(idToken: string): any {
    // In production, use google-auth-library to verify the token
    // This is a mock implementation for development
    try {
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload;
    } catch (error) {
      throw new BadRequestException('Invalid Google token');
    }
  }

  private decodeAppleToken(identityToken: string): any {
    // In production, verify Apple token properly
    // This is a mock implementation for development
    try {
      const parts = identityToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload;
    } catch (error) {
      throw new BadRequestException('Invalid Apple token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: forgotPasswordDto.email },
      });

      if (!user) {
        // Don't reveal if email exists or not for security reasons
        this.logger.log(`Password reset requested for non-existent email: ${forgotPasswordDto.email}`);
        return {
          message: 'If the email exists, a password reset code has been sent.',
        };
      }

      // Generate 6-digit reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Hash the reset code before storing
      const hashedResetCode = await bcrypt.hash(resetCode, 10);
      
      // Set expiration to 30 minutes from now
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      // Store reset code and expiration in database
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resettoken: hashedResetCode,
          resettokenexpires: expiresAt,
        },
      });

      // Send email with reset code
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetCode,
        user.name,
      );

      this.logger.log(`Password reset code sent to ${user.email}`);

      return {
        message: 'If the email exists, a password reset code has been sent.',
      };
    } catch (error) {
      this.logger.error(`Failed to process forgot password: ${error.message}`, error.stack);
      throw error;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: resetPasswordDto.email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.resettoken || !user.resettokenexpires) {
        throw new BadRequestException('No password reset requested for this account');
      }

      // Check if reset code has expired
      if (new Date() > user.resettokenexpires) {
        throw new BadRequestException('Reset code has expired. Please request a new one.');
      }

      // Verify reset code
      const isValidCode = await bcrypt.compare(resetPasswordDto.resetCode, user.resettoken);
      if (!isValidCode) {
        throw new BadRequestException('Invalid reset code');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

      // Update password and clear reset token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resettoken: null,
          resettokenexpires: null,
        },
      });

      this.logger.log(`Password reset successful for ${user.email}`);

      return {
        message: 'Password has been reset successfully. You can now login with your new password.',
      };
    } catch (error) {
      this.logger.error(`Failed to reset password: ${error.message}`, error.stack);
      throw error;
    }
  }
}
