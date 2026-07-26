import { PartialType } from '@nestjs/swagger';
import { CreatePeticionDto } from './create-peticion.dto';

export class UpdatePeticionDto extends PartialType(CreatePeticionDto) {}
