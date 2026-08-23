import { Route, Routes } from 'react-router'

import { AdminLoginPage } from '@/pages/AdminLoginPage'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { AdminResourcePage } from '@/pages/AdminResourcePage'
import { HomePage } from '@/pages/HomePage'

function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<AdminLoginPage />} path="/admin/login" />
      <Route element={<AdminDashboardPage />} path="/admin" />
      <Route element={<AdminResourcePage resource="produtos" />} path="/admin/produtos" />
      <Route element={<AdminResourcePage resource="estoque" />} path="/admin/estoque" />
      <Route element={<AdminResourcePage resource="pedidos" />} path="/admin/pedidos" />
      <Route element={<AdminResourcePage resource="clientes" />} path="/admin/clientes" />
      <Route element={<AdminResourcePage resource="trocas" />} path="/admin/trocas" />
      <Route element={<AdminResourcePage resource="analises" />} path="/admin/analises" />
      <Route element={<HomePage />} path="*" />
    </Routes>
  )
}

export default App
