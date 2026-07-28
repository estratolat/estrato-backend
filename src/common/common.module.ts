import { Module, Global } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { AnthropicService } from './services/anthropic.service';
import { TranscripcionService } from './services/transcripcion.service';
import { MailService } from './services/mail.service';
import { MailController } from './controllers/mail.controller';

@Global()
@Module({
  providers: [PrismaService, AnthropicService, TranscripcionService, MailService],
  controllers: [MailController],
  exports: [PrismaService, AnthropicService, TranscripcionService, MailService],
})
export class CommonModule {}
