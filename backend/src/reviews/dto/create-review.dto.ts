import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import { trim } from '../../common/transforms'


export class CreateReviewDto {
  @IsInt({ message: 'Поставьте оценку от 1 до 5.' })
  @Min(1, { message: 'Поставьте оценку от 1 до 5.' })
  @Max(5, { message: 'Поставьте оценку от 1 до 5.' })
  rating!: number

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000, { message: 'Отзыв — не длиннее 1000 символов.' })
  text?: string
}
