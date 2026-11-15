import { ItemCondition, TransferFormat } from '@prisma/client'
import { Transform } from 'class-transformer'
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString,
  Matches, Max, MaxLength, Min, MinLength, ValidateIf,
} from 'class-validator'
import { trim } from '../../common/transforms'
import { ITEM_LIMITS as L, PHOTO_KEY_PATTERN } from '../items.constants'

export class CreateItemDto {
  @Transform(trim)
  @IsString()
  @MinLength(L.titleMin, { message: `Название — не короче ${L.titleMin} символов.` })
  @MaxLength(L.titleMax, { message: `Название — не длиннее ${L.titleMax} символов.` })
  title!: string

  @Transform(trim)
  @IsString()
  @MinLength(L.descriptionMin, { message: `Опишите вещь подробнее — не короче ${L.descriptionMin} символов.` })
  @MaxLength(L.descriptionMax, { message: `Описание — не длиннее ${L.descriptionMax} символов.` })
  description!: string

  @IsInt({ message: 'Выберите категорию.' })
  @Min(1)
  categoryId!: number

  @IsEnum(ItemCondition, { message: 'Выберите состояние вещи.' })
  condition!: ItemCondition

  @IsEnum(TransferFormat, { message: 'Выберите формат передачи: даром или обмен.' })
  transferFormat!: TransferFormat

  @ValidateIf((o: CreateItemDto) => o.transferFormat === TransferFormat.exchange || o.wantedInReturn !== undefined)
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Напишите, что хотите получить взамен.' })
  @MaxLength(L.wantedMax)
  wantedInReturn?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(L.quantityMax)
  quantity?: number 

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001, { message: 'Вес должен быть больше нуля.' })
  @Max(L.weightMaxKg)
  weightKg?: number

  @IsInt({ message: 'Выберите район.' })
  @Min(1)
  districtId!: number

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(L.meetingNoteMax)
  meetingNote?: string

  @IsArray()
  @ArrayMinSize(L.photosMin, { message: 'Добавьте хотя бы одну фотографию.' })
  @ArrayMaxSize(L.photosMax, { message: `Не больше ${L.photosMax} фотографий.` })
  @IsString({ each: true })
  @Matches(PHOTO_KEY_PATTERN, { each: true, message: 'Некорректная фотография.' })
  photoKeys!: string[]
}