import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [CrmController],
  providers: [CrmService, MessagingService, PrismaService],
  exports: [CrmService, MessagingService],
})
export class CrmModule {}
