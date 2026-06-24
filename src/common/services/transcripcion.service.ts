import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class TranscripcionService {
  private readonly logger = new Logger(TranscripcionService.name);
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY_2 || process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
      throw new BadRequestException(
        'OPENAI_API_KEY no está configurada. La transcripción automática no está disponible.',
      );
    }
    if (!this.client) {
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  /**
   * Recibe una data URL de video, extrae el audio y lo transcribe con Whisper.
   * Por simplicidad en serverless, guardamos temporalmente el buffer y luego lo borramos.
   * Nota: Whisper soporta archivos de audio de hasta 25 MB.
   */
  async transcribirVideo(dataUrl: string): Promise<string> {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      throw new BadRequestException('Se requiere una data URL válida de video');
    }

    // Extraer mime y base64
    const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
    if (!match) {
      throw new BadRequestException('Formato de data URL inválido');
    }

    const [, mime, base64] = match;
    const buffer = Buffer.from(base64, 'base64');
    this.logger.log(`Transcribiendo video: ${mime}, tamaño ${buffer.length} bytes`);

    const ext = mime.includes('mp4') ? 'mp4' : mime.split('/')[1] || 'webm';
    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `video_${Date.now()}.${ext}`);
    const audioPath = path.join(tmpDir, `audio_${Date.now()}.mp3`);

    try {
      fs.writeFileSync(inputPath, buffer);

      // Intentar extraer audio con ffmpeg si está instalado
      const { execSync } = await import('child_process');
      try {
        execSync(`ffmpeg -i "${inputPath}" -vn -ar 16000 -ac 1 -b:a 32k "${audioPath}" -y`, {
          stdio: 'pipe',
          timeout: 120000,
        });
      } catch (ffmpegError) {
        this.logger.warn('ffmpeg no disponible o falló. Intentando transcribir archivo original.');
        fs.copyFileSync(inputPath, audioPath);
      }

      const fileStream = fs.createReadStream(audioPath);
      const client = this.getClient();
      const response = await client.audio.transcriptions.create({
        file: fileStream as any,
        model: 'whisper-1',
        language: 'es',
        response_format: 'text',
      });

      return typeof response === 'string' ? response : (response as any).text || '';
    } finally {
      try { fs.unlinkSync(inputPath); } catch {}
      try { fs.unlinkSync(audioPath); } catch {}
    }
  }
}
