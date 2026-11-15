import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthUser } from '../auth/auth.types'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { Page, PaginationQueryDto } from '../common/pagination.dto'
import { CreateItemDto } from './dto/create-item.dto'
import { ListItemsQueryDto } from './dto/list-items-query.dto'
import { SetItemVisibilityDto } from './dto/set-item-visibility.dto'
import { UpdateItemDto } from './dto/update-item.dto'
import { ItemCardDto, ItemDetailsDto } from './items.responses'
import { ItemsService } from './items.service'

@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Public()
  @Get()
  list(@Query() query: ListItemsQueryDto): Promise<Page<ItemCardDto>> {
    return this.items.list(query)
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto): Promise<Page<ItemCardDto>> {
    return this.items.listMine(user.id, query)
  }

  @Public()
  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number, @CurrentUser() viewer?: AuthUser): Promise<ItemDetailsDto> {
    return this.items.get(id, viewer)
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateItemDto): Promise<ItemDetailsDto> {
    return this.items.create(user, dto)
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateItemDto,
  ): Promise<ItemDetailsDto> {
    return this.items.update(id, user, dto)
  }

  @HttpCode(200)
  @Post(':id/visibility')
  setVisibility(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: SetItemVisibilityDto,
  ): Promise<ItemDetailsDto> {
    return this.items.setVisibility(id, user, dto)
  }

  @HttpCode(204)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser): Promise<void> {
    return this.items.remove(id, user)
  }
}
