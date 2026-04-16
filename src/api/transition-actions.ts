import { api } from './client'
import { API_ROUTES } from '../config'
import type { TransitionActionsResponse, TransitionActionExecution } from '../types/api'

/**
 * GET /api/v1/purchase_orders/:poId/transition_actions
 *
 * Returns post-transition actions for the PO's last successful transition,
 * including per-action execution history so the UI can show status and
 * offer re-trigger for repeatable actions.
 */
export async function getTransitionActions(poId: number): Promise<TransitionActionsResponse> {
  return api.get<TransitionActionsResponse>(API_ROUTES.PURCHASE_ORDER_TRANSITION_ACTIONS(poId))
}

/**
 * POST /api/v1/purchase_orders/:poId/execute_transition_action
 *
 * Manually triggers a post-transition action.
 * Returns the newly created execution record.
 */
export async function executeTransitionAction(
  poId: number,
  actionId: number,
  transitionAttemptId: number
): Promise<TransitionActionExecution> {
  const result = await api.post<{ execution: TransitionActionExecution }>(
    API_ROUTES.PURCHASE_ORDER_EXECUTE_TRANSITION_ACTION(poId),
    {
      action_id: actionId,
      transition_attempt_id: transitionAttemptId,
    }
  )
  return result.execution
}
