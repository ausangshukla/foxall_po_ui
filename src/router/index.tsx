import { Routes, Route } from 'react-router-dom'
import { Layout } from '../components/Layout'
import {
  HomePage,
  LoginPage,
  DashboardPage,
  ProfilePage,
  UserListPage,
  UserFormPage,
  UserShowPage,
  EntityListPage,
  EntityFormPage,
  EntityShowPage,
  PurchaseOrderListPage,
  PurchaseOrderFormPage,
  PurchaseOrderShowPage,
} from '../pages'
import { NotFound } from '../components/common'

export function AppRouter() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/users" element={<UserListPage />} />
        <Route path="/users/new" element={<UserFormPage />} />
        <Route path="/users/:id" element={<UserShowPage />} />
        <Route path="/users/:id/edit" element={<UserFormPage />} />
        <Route path="/entities" element={<EntityListPage />} />
        <Route path="/entities/new" element={<EntityFormPage />} />
        <Route path="/entities/:id/edit" element={<EntityFormPage />} />
        <Route path="/entities/:id" element={<EntityShowPage />} />
        <Route path="/purchase-orders" element={<PurchaseOrderListPage />} />
        <Route path="/purchase-orders/new" element={<PurchaseOrderFormPage />} />
        <Route path="/purchase-orders/:id" element={<PurchaseOrderShowPage />} />
        <Route path="/purchase-orders/:id/edit" element={<PurchaseOrderFormPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
