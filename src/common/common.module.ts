import { Module, Global } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { AnthropicService } from './services/anthropic.service';
import { TranscripcionService } from './services/transcripcion.service';

@Global()
@Module({
  providers: [PrismaService, AnthropicService, TranscripcionService],
  exports: [PrismaService, AnthropicService, TranscripcionService],
})
export class CommonModule {}
