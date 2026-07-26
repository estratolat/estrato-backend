import { PartialType } from '@nestjs/mapped-types';
import { CreateOpositorDto } from './create-opositor.dto';

export class UpdateOpositorDto extends PartialType(CreateOpositorDto) {}
