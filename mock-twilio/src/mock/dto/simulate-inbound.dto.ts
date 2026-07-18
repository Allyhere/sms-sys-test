import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class SimulateInboundDto {
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsOptional()
  to?: string;

  @IsNumber()
  @IsOptional()
  numMedia?: number;

  @IsNumber()
  @IsOptional()
  numSegments?: number;

  @IsString()
  @IsOptional()
  accountSid?: string;

  @IsString()
  @IsOptional()
  messagingServiceSid?: string;

  @IsBoolean()
  @IsOptional()
  signature?: boolean;
}
