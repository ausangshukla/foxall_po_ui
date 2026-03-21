import { Routes, Route } from 'react-router-dom'
import { Layout } from '../components/Layout'
import {
  HomePage,
  LoginPage,
  DashboardPage,
  UserListPage,
  UserFormPage,
  UserShowPage,
  EntityListPage,
  EntityFormPage,
  EntityShowPage,
  PurchaseOrderListPage,
  PurchaseOrderFormPage,
  PurchaseOrderShowPage,
  CustomFieldDefinitionListPage,
  CustomFieldDefinitionFormPage,
} from '../pages'
import { NotFound } from '../components/common'

export function AppRouter() {
  return (
    <Routes>
      {/* Route without layout */}
      <Route path="/login" element={<LoginPage />} />

      {/* Routes with layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<UserShowPage />} />
        <Route path="/profile/edit" element={<UserFormPage />} />
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

        {/* Custom Field Definitions */}
        <Route path="/custom-field-definitions" element={<CustomFieldDefinitionListPage />} />
        <Route path="/custom-field-definitions/new" element={<CustomFieldDefinitionFormPage />} />
        <Route path="/custom-field-definitions/:id/edit" element={<CustomFieldDefinitionFormPage />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
