import { Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth.tsx'
import { Layout } from './components/Layout.tsx'
import { BuilderPage } from './pages/BuilderPage.tsx'
import { FavoritesPage } from './pages/FavoritesPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { OrderDetailPage } from './pages/OrderDetailPage.tsx'
import { OrdersPage } from './pages/OrdersPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<BuilderPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/favorites"
          element={
            <RequireAuth>
              <FavoritesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <OrdersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireAuth>
              <OrderDetailPage />
            </RequireAuth>
          }
        />
      </Routes>
    </Layout>
  )
}
