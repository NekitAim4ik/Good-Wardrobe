import { Transform } from 'class-transformer'
import { IsInt, IsString, MaxLength, MinLength, Min } from 'class-validator'
import { trim } from '../../common/transforms'


export class CreateDealDto {
  @IsInt()
  @Min(1)
  itemId!: number

  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Напишите сообщение автору.' })
  @MaxLength(2000, { message: 'Сообщение — не длиннее 2000 символов.' })
  message!: string
}
