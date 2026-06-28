import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TenantsService } from '../tenants/tenants.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, TenantsService, PrismaService],
  exports: [AdminService],
})
export class AdminModule {}
