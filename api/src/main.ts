import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as fs from "fs";

async function bootstrap() {
  const uploadsDir = join(process.cwd(), 'uploads', 'lab-results');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const msgUploadsDir = join(process.cwd(), 'uploads', 'messages');
  if (!fs.existsSync(msgUploadsDir)) fs.mkdirSync(msgUploadsDir, { recursive: true });
  const profileUploadsDir = join(process.cwd(), 'uploads', 'profiles');
  if (!fs.existsSync(profileUploadsDir)) fs.mkdirSync(profileUploadsDir, { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.enableCors({
    origin: ['http://localhost:3000', 'https://wc-telehealth-nu.vercel.app'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
