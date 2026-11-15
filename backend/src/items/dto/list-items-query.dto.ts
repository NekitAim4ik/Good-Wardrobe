import { ItemCondition, ItemSource, TransferFormat } from '@prisma/client'
import { Transform, Type } from 'class-transformer'
import { IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import { trim } from '../../common/transforms'
import { PaginationQueryDto } from '../../common/pagination.dto'

export class ListItemsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string 

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number

  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition

  @IsOptional()
  @IsEnum(TransferFormat)
  transferFormat?: TransferFormat

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  districtId?: number

  @IsOptional()
  @IsEnum(ItemSource)
  source?: ItemSource

  @IsOptional()
  @IsDateString()
  publishedAfter?: string 

  @IsOptional()
  @IsIn(['new', 'old'])
  sort: 'new' | 'old' = 'new'
}