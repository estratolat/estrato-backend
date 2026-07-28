import { Module, Global } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { AnthropicService } from './services/anthropic.service';
import { TranscripcionService } from './services/transcripcion.service';
import { MailService } from './services/mail.service';

@Global()
@Module({
  providers: [PrismaService, AnthropicService, TranscripcionService, MailService],
  exports: [PrismaService, AnthropicService, TranscripcionService, MailService],
})
export class CommonModule {}
