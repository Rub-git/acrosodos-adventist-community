import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // CORS Configuration - Allow all origins for development
  app.enableCors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400, // Cache preflight for 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Configuration
  const swaggerPath = 'api-docs';
  
  // Prevent CDN/browser caching of Swagger docs
  app.use(`/${swaggerPath}`, (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Adventist Community API')
    .setDescription('Backend API for Seventh-day Adventist faith-centered social community platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User registration, login, and JWT authentication')
    .addTag('Users', 'User profile management')
    .addTag('Media', 'File upload and media management')
    .addTag('Sabbath', 'Sabbath mode and timezone-aware calculations')
    .addTag('Posts', 'Create and manage community posts')
    .addTag('Reactions', 'React to posts with encouragement')
    .addTag('Comments', 'Comment on posts')
    .addTag('Moderation', 'Content reporting and moderation')
    .addTag('Admin', 'Administrative functions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup(swaggerPath, app, document, {
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #1a202c; font-size: 2rem; font-weight: 700; }
      .swagger-ui .info .description { color: #4a5568; font-size: 1rem; line-height: 1.6; }
      .swagger-ui { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; }
      .swagger-ui .opblock-tag { font-size: 1.1rem; font-weight: 600; color: #2d3748; border-bottom: 2px solid #e2e8f0; }
      .swagger-ui .opblock { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 1rem; }
      .swagger-ui .opblock .opblock-summary { padding: 1rem; }
      .swagger-ui .btn.authorize { background-color: #4299e1; border-color: #4299e1; }
      .swagger-ui .btn.execute { background-color: #48bb78; border-color: #48bb78; }
    `,
    customSiteTitle: 'Adventist Community API',
    customfavIcon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📖</text></svg>',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/${swaggerPath}`);
  logger.log(`✝️  Adventist Community Backend - Serving with faith and excellence`);
}

bootstrap();
