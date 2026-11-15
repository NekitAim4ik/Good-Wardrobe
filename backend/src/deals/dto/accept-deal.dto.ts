import { Transform } from 'class-transformer'
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator'
import { trim } from '../../common/transforms'


export class AcceptDealDto {
  @IsOptional()
  @IsDateString()
  meetingAt?: string

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  meetingNote?: string
}
