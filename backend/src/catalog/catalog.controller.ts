import { Controller, Get } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'
import { PrismaService } from '../prisma/prisma.service'
import { CategoryDto, CityDto } from './catalog.responses'

@Controller()
export class CatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('categories')
  async categories(): Promise<CategoryDto[]> {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { coefficients: { where: { validFrom: { lte: new Date() } }, orderBy: { validFrom: 'desc' }, take: 1 } },
    })
    return rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      examples: c.examples,
      requiresWeight: c.coefficients[0]?.avgMassKg == null,
    }))
  }

  @Public()
  @Get('districts')
  async districts(): Promise<CityDto[]> {
    const rows = await this.prisma.city.findMany({
      orderBy: { name: 'asc' },
      include: { districts: { orderBy: { name: 'asc' }, select: { id: true, name: true } } },
    })
    return rows.map((c) => ({ id: c.id, name: c.name, isTest: c.isTest, districts: c.districts }))
  }
}
