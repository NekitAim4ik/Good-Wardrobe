import { Transform } from 'class-transformer'
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { normalizeEmail } from './transforms'

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Проверьте адрес эл. почты.' })
  email!: string

  @IsString()
  @IsNotEmpty({ message: 'Введите пароль.' })
  @MaxLength(128) 
  password!: string

  @IsOptional()
  @IsBoolean()
  remember?: boolean
}