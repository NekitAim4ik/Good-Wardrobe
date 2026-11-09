import { Header } from '../../widgets/header/Header'
import { Hero } from './Hero'
import { Nearby, Perks, TwoWays } from './Sections'

export function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Perks />
        <TwoWays />
        <Nearby />
      </main>
      <footer className="container footer muted">© Добрый Шкаф · Учебный проект</footer>
    </>
  )
}
