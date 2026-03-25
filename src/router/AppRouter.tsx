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
  ExternalPartyListPage,
  ExternalPartyShowPage,
  ExternalPartyFormPage,
  NotificationRuleListPage,
  NotificationRuleFormPage,
  NotificationRuleShowPage,
  PoStateListPage,
  PoStateFormPage,
  PoTransitionRuleListPage,
  PoTransitionRuleFormPage,
  PoTransitionRuleShowPage,
} from '../pages'
import { NotFound } from '../components/common'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
        <Route path="/custom-field-definitions" element={<CustomFieldDefinitionListPage />} />
        <Route path="/custom-field-definitions/new" element={<CustomFieldDefinitionFormPage />} />
        <Route path="/custom-field-definitions/:id/edit" element={<CustomFieldDefinitionFormPage />} />
        <Route path="/external-parties" element={<ExternalPartyListPage />} />
        <Route path="/external-parties/new" element={<ExternalPartyFormPage />} />
        <Route path="/external-parties/new/:poId" element={<ExternalPartyFormPage />} />
        <Route path="/external-parties/:id" element={<ExternalPartyShowPage />} />
        <Route path="/external-parties/:id/edit" element={<ExternalPartyFormPage />} />

        <Route path="/notification-rules" element={<NotificationRuleListPage />} />
        <Route path="/notification-rules/new" element={<NotificationRuleFormPage />} />
        <Route path="/notification-rules/:id" element={<NotificationRuleShowPage />} />
        <Route path="/notification-rules/:id/edit" element={<NotificationRuleFormPage />} />

        <Route path="/po-states" element={<PoStateListPage />} />
        <Route path="/po-states/new" element={<PoStateFormPage />} />
        <Route path="/po-states/:id/edit" element={<PoStateFormPage />} />

        <Route path="/po-transition-rules" element={<PoTransitionRuleListPage />} />
        <Route path="/po-transition-rules/new" element={<PoTransitionRuleFormPage />} />
        <Route path="/po-transition-rules/:id" element={<PoTransitionRuleShowPage />} />
        <Route path="/po-transition-rules/:id/edit" element={<PoTransitionRuleFormPage />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
