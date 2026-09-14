import { HashRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
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
          </Routes>
        </HashRouter>
      </TierlistsProvider>
    </ThemeProvider>
  )
}
