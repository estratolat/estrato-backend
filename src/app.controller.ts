import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  health() {
    return {
      status: 'ok',
      service: 'ESTRATO API',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('env-check')
  @ApiOperation({ summary: 'Verificar presencia de variables de entorno (sin exponer valores)' })
  envCheck() {
    const anthropicKey = process.env.ANTHROPIC_API_KEY_2 || process.env.ANTHROPIC_API_KEY || '';
    const openaiKey = process.env.OPENAI_API_KEY_2 || process.env.OPENAI_API_KEY || '';
    return {
      anthropic_api_key_present: !!anthropicKey.trim(),
      anthropic_api_key_length: anthropicKey.length,
      anthropic_model: process.env.ANTHROPIC_MODEL || 'not-set',
      openai_api_key_present: !!openaiKey.trim(),
      node_env: process.env.NODE_ENV || 'not-set',
    };
  }
}
