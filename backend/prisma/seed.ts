// Первичное наполнение справочников: npm run db:seed (можно запускать повторно — дубли не создаются).
// Категории и коэффициенты — стартовые значения из раздела 3.4 ТЗ (округлённые, для MVP).
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// [slug, название, примеры, m кг/шт. (null — нет нормативной массы), k кг CO₂e/кг]
const CATEGORIES: [string, string, string, number | null, number][] = [
  ['clothes', 'Одежда', 'Футболки, брюки, куртки, свитера', 0.3, 10.5],
  ['shoes', 'Обувь', 'Кроссовки, ботинки, туфли', 0.43, 4.2],
  ['textile', 'Текстиль', 'Постельное бельё, шторы, ковры, ткани', 1.0, 10.0],
  ['bags', 'Сумки и аксессуары', 'Рюкзаки, сумки, чемоданы', 0.3, 8.5],
  ['furniture', 'Мебель', 'Столы, стулья, шкафы, диваны', 15.0, 3.2],
  ['appliances', 'Бытовая техника', 'Холодильники, стиральные машины, плиты, микроволновки', 32.5, 5.0],
  ['small-appliances', 'Мелкие электроприборы', 'Чайники, фены, тостеры, утюги, пылесосы', 0.5, 5.0],
  ['electronics', 'Компьютеры и электроника', 'Ноутбуки, компьютеры, мониторы, планшеты, периферия', 0.75, 71.5],
  ['home-textile', 'Домашний текстиль', 'Подушки, одеяла, покрывала', 0.33, 17.0],
  ['glassware', 'Стеклянные изделия', 'Стаканы, посуда, вазы', 0.28, 0.5],
  ['ceramics', 'Керамика', 'Тарелки, кружки, керамическая посуда', 0.36, 0.5],
  ['metal-cookware', 'Металлическая посуда', 'Кастрюли, сковородки, столовые приборы', 0.28, 4.0],
  ['toys-sports', 'Игрушки и спортивные товары', 'Игрушки, спортивный инвентарь, настольные игры', 0.25, 2.5],
  ['books', 'Книги и печатная продукция', 'Книги, журналы, учебники', 0.25, 14.5],
  ['media', 'Музыка и видео', 'Диски, музыкальные носители, видеоматериалы', 0.19, 4.0],
  ['plastic', 'Пластиковые изделия', 'Пластиковые контейнеры, предметы быта', 0.2, 3.0],
  ['rubber', 'Резиновые изделия', 'Резиновые предметы, изделия из резины', null, 2.0],
  ['tools', 'Инструменты', 'Ручной инструмент, металлические инструменты', 1.5, 4.0],
  ['garden', 'Садовая техника и оборудование', 'Газонокосилки, садовые инструменты', 5.0, 5.0],
  ['wooden', 'Деревянные изделия', 'Деревянные предметы, пиломатериалы', 12.5, 0.5],
  ['ferrous', 'Изделия из чёрных металлов', 'Металлические предметы', 1.0, 2.0],
  ['non-ferrous', 'Изделия из цветных металлов', 'Алюминиевые и медные изделия', null, 4.5],
  ['other', 'Прочие товары', 'Вещи, не подходящие под остальные категории', 5.5, 1.5],
]

const COEFFICIENTS_SOURCE = 'ТЗ «Добрый шкаф» v1.0, раздел 3.4 (стартовые значения для MVP)'
const COEFFICIENTS_VALID_FROM = new Date('2026-01-01T00:00:00Z')

async function main() {
  for (const [index, [slug, name, examples, avgMassKg, co2PerKg]] of CATEGORIES.entries()) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { slug, name, examples, sortOrder: index },
    })
    await prisma.ecoCoefficient.upsert({
      where: { categoryId_version: { categoryId: category.id, version: 1 } },
      update: {}, // существующие версии не меняем: новое значение — новая версия
      create: {
        categoryId: category.id,
        version: 1,
        avgMassKg,
        co2PerKg,
        source: COEFFICIENTS_SOURCE,
        validFrom: COEFFICIENTS_VALID_FROM,
      },
    })
  }

  // Тестовый город и районы, чтобы можно было создавать объявления. Заменить реальными (FR-ADM-03).
  const city = await prisma.city.upsert({
    where: { name: 'Тестовый город' },
    update: {},
    create: { name: 'Тестовый город', isTest: true },
  })
  for (const name of ['Центральный', 'Северный', 'Южный']) {
    await prisma.district.upsert({
      where: { cityId_name: { cityId: city.id, name } },
      update: {},
      create: { cityId: city.id, name },
    })
  }
  console.log(`Готово: категорий ${CATEGORIES.length}, версия коэффициентов 1, тестовый город с 3 районами.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
