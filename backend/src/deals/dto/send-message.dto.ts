import { Transform } from 'class-transformer'
import { IsString, MaxLength, MinLength } from 'class-validator'
import { trim } from '../../common/transforms'


export class SendMessageDto {
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Сообщение не может быть пустым.' })
  @MaxLength(2000, { message: 'Сообщение — не длиннее 2000 символов.' })
  body!: string
}
