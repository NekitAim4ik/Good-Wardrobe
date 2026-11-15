import { CancelReason } from '@prisma/client'
import { Transform } from 'class-transformer'
import { IsEnum, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator'
import { trim } from '../../common/transforms'


export class CancelDealDto {
  @IsEnum(CancelReason, { message: 'Выберите причину отмены.' })
  reason!: CancelReason

  @ValidateIf((o: CancelDealDto) => o.reason === CancelReason.other || o.comment !== undefined)
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Опишите причину отмены.' })
  @MaxLength(500)
  comment?: string
}
