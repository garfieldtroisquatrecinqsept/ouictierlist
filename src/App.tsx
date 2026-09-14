import { HashRouter, Route, Routes } from 'react-router-dom'
import { ComparePage } from './pages/ComparePage'
import { HomePage } from './pages/HomePage'
import { PlayersPage } from './pages/PlayersPage'
import { TeamsPage } from './pages/TeamsPage'
import { TierlistPage } from './pages/TierlistPage'
import { ThemeProvider } from './store/ThemeContext'
import { TierlistsProvider } from './store/TierlistsContext'

export default function App() {
  return (
    <ThemeProvider>
      <TierlistsProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tierlist/:id" element={<TierlistPage />} />
            <Route path="/joueurs" element={<PlayersPage />} />
            <Route path="/comparer" element={<ComparePage />} />
            <Route path="/equipes" element={<TeamsPage />} />
          </Routes>
        </HashRouter>
      </TierlistsProvider>
    </ThemeProvider>
  )
}
