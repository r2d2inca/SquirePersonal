import '@/stores/themeStore' // Initialize theme on load
import '@/lib/sound' // Register the audio-unlock listeners before any UI mounts
import { BrowserRouter, Routes, Route } from 'react-router'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { LoginPage } from '@/pages/LoginPage'
import { RoleSelectPage } from '@/pages/RoleSelectPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CharacterCreatePage } from '@/pages/CharacterCreatePage'
import { DMDashboardPage } from '@/pages/DMDashboardPage'
import { CampaignCreatePage } from '@/pages/CampaignCreatePage'
import { LandingPage } from '@/pages/marketing/LandingPage'
import { FeaturesPage } from '@/pages/marketing/FeaturesPage'
import { AboutPage } from '@/pages/marketing/AboutPage'
import { BetaPage } from '@/pages/marketing/BetaPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      gcTime: 1000 * 60 * 60 * 24, // keep cached data 24h for offline use
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
})

export default function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}>
      <BrowserRouter>
        <Routes>
          {/* Public marketing site */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/beta" element={<BetaPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Authenticated app */}
          <Route element={<AuthGuard />}>
            <Route element={<RoleGuard />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/new-character" element={<CharacterCreatePage />} />
              <Route path="/dm" element={<DMDashboardPage />} />
              <Route path="/new-campaign" element={<CampaignCreatePage />} />
            </Route>
            <Route path="/select-role" element={<RoleSelectPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PersistQueryClientProvider>
  )
}
