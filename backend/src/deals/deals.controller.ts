import { Body, Controller, Post } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthUser } from '../auth/auth.types'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { CreateDealDto } from './dto/create-deal.dto'
import { DealCreatedDto } from './deals.responses'
import { DealsService } from './deals.service'

@Controller('deals')
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDealDto): Promise<DealCreatedDto> {
    return this.deals.create(user, dto)
  }
}
