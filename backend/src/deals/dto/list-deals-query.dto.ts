import { DealStatus } from '@prisma/client'
import { IsEnum, IsIn, IsOptional } from 'class-validator'
import { PaginationQueryDto } from '../../common/pagination.dto'


export class ListDealsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['giver', 'receiver'])
  role?: 'giver' | 'receiver' 

  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus
}
