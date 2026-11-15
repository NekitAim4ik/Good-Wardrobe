import { IsBoolean } from 'class-validator'

export class SetItemVisibilityDto {
  @IsBoolean()
  hidden!: boolean
}
