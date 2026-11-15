import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthUser } from '../auth/auth.types'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Page } from '../common/pagination.dto'
import { AcceptDealDto } from './dto/accept-deal.dto'
import { CancelDealDto } from './dto/cancel-deal.dto'
import { CreateDealDto } from './dto/create-deal.dto'
import { ListDealsQueryDto } from './dto/list-deals-query.dto'
import { ListMessagesQueryDto } from './dto/list-messages-query.dto'
import { SendMessageDto } from './dto/send-message.dto'
import { DealCreatedDto, DealDetailsDto, DealSummaryDto, MessageDto } from './deals.responses'
import { DealsService } from './deals.service'

@Controller('deals')
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDealDto): Promise<DealCreatedDto> {
    return this.deals.create(user, dto)
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListDealsQueryDto): Promise<Page<DealSummaryDto>> {
    return this.deals.list(user, query)
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser): Promise<DealDetailsDto> {
    return this.deals.get(id, user)
  }

  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Get(':id/messages')
  messages(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Query() query: ListMessagesQueryDto,
  ): Promise<MessageDto[]> {
    return this.deals.listMessages(id, user, query)
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post(':id/messages')
  send(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: SendMessageDto,
  ): Promise<MessageDto> {
    return this.deals.sendMessage(id, user, dto)
  }

  @HttpCode(200)
  @Post(':id/accept')
  accept(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser, @Body() dto: AcceptDealDto) {
    return this.deals.accept(id, user, dto)
  }

  @HttpCode(200)
  @Post(':id/handover')
  handover(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.deals.handover(id, user)
  }

  @HttpCode(200)
  @Post(':id/confirm')
  confirm(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.deals.confirm(id, user)
  }

  @HttpCode(200)
  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser, @Body() dto: CancelDealDto) {
    return this.deals.cancel(id, user, dto)
  }
}