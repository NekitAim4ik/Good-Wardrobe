import { ReportReason } from '@prisma/client'
import { Transform } from 'class-transformer'
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, ValidateIf } from 'class-validator'
import { trim } from '../../common/transforms'


export class CreateReportDto {
  @IsEnum(ReportReason, { message: 'Выберите причину жалобы.' })
  reason!: ReportReason

  @ValidateIf((o: CreateReportDto) => o.reason === ReportReason.other || o.comment !== undefined)
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Опишите, что не так.' })
  @MaxLength(1000)
  comment?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  dealId?: number
}
