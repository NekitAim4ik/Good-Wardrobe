import { Transform } from 'class-transformer'
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'
import { normalizeEmail, trim } from './transforms'

export const REGISTER_ROLES = ['user', 'volunteer', 'organizer'] as const
export type RegisterRole = (typeof REGISTER_ROLES)[number]

const PASSWORD_MESSAGE = 'Пароль должен быть не короче 8 символов, с буквами и цифрами.'

export class RegisterDto {
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Введите имя — не короче 2 символов.' })
  @MaxLength(80, { message: 'Имя слишком длинное.' })
  name!: string

  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Проверьте адрес эл. почты.' })
  @MaxLength(254)
  email!: string

  @IsString()
  @MinLength(8, { message: PASSWORD_MESSAGE })
  @MaxLength(128, { message: 'Пароль слишком длинный (максимум 128 символов).' })
  @Matches(/[A-Za-zА-Яа-яЁё]/, { message: PASSWORD_MESSAGE })
  @Matches(/\d/, { message: PASSWORD_MESSAGE })
  password!: string

  @IsOptional()
  @IsIn(REGISTER_ROLES, { message: 'Недопустимая роль.' })
  role?: RegisterRole
}