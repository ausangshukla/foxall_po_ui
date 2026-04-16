import { useCallback, useEffect, useState } from 'react'
import { getTransitionActions, executeTransitionAction } from '../../api/transition-actions'
import type { TransitionAction, TransitionActionExecution, TransitionActionsResponse } from '../../types/api'

interface Props {
  purchaseOrderId: number
  /** Increment this to force a refresh after a new transition fires */
  refreshKey?: number
}

// Maps a status to its colour tokens
const statusStyle: Record<string, string> = {
  success: 'bg-green-100 text-green-800 border-green-300',
  failed:  'bg-red-100 text-red-800 border-red-300',
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
}

const triggerIcon: Record<string, string> = {
  automatic: 'bolt',
  manual:    'touch_app',
}

export function TransitionActionsPanel({ purchaseOrderId, refreshKey }: Props) {
  const [data, setData]         = useState<TransitionActionsResponse | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)
  // Tracks which action is currently being triggered (id → loading bool)
  const [executing, setExecuting] = useState<Record<number, boolean>>({})

  // ------------------------------------------------------------------
  // Load / reload actions
  // ------------------------------------------------------------------
  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getTransitionActions(purchaseOrderId)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [purchaseOrderId])

  useEffect(() => { load() }, [load, refreshKey])

  // ------------------------------------------------------------------
  // Execute a manual action
  // ------------------------------------------------------------------
  const handleExecute = useCallback(
    async (action: TransitionAction) => {
      if (!data?.transition_attempt_id) return
      setExecuting(prev => ({ ...prev, [action.id]: true }))
      try {
        await executeTransitionAction(purchaseOrderId, action.id, data.transition_attempt_id)
        // Reload to show updated execution history
        load()
      } catch (err) {
        // Surface error inline — don't block the whole panel
        setError((err as Error).message)
      } finally {
        setExecuting(prev => ({ ...prev, [action.id]: false }))
      }
    },
    [data, purchaseOrderId, load]
  )

  // ------------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-on-surface-variant text-sm py-4">
        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
        Loading actions…
      </div>
    )
  }

  // Nothing to show — no successful transition recorded yet
  if (!data || !data.transition_attempt_id || data.actions.length === 0) return null

  return (
    <section className="glass-panel ambient-shadow rounded-xl border border-outline-variant/20 overflow-hidden">
      {/* Header */}
      <div className="bg-surface-container px-6 py-4 flex items-center gap-3 border-b border-outline-variant/20">
        <span className="material-symbols-outlined text-primary text-xl">electric_bolt</span>
        <div>
          <h2 className="font-extrabold tracking-tight text-on-primary-container text-base leading-tight">
            Post-transition Actions
          </h2>
          {data.transition_rule && (
            <p className="text-xs text-on-surface-variant mt-0.5">
              After: <span className="font-semibold">{data.transition_rule.action_name}</span>
              {' '}({data.transition_rule.from_state} → {data.transition_rule.to_state})
            </p>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {/* Action cards */}
      <div className="divide-y divide-outline-variant/20">
        {data.actions.map(action => (
          <ActionCard
            key={action.id}
            action={action}
            isExecuting={executing[action.id] ?? false}
            onExecute={handleExecute}
          />
        ))}
      </div>
    </section>
  )
}

// ==========================================================================
// ActionCard — one action with its full execution history
// ==========================================================================

interface ActionCardProps {
  action: TransitionAction
  isExecuting: boolean
  onExecute: (action: TransitionAction) => void
}

function ActionCard({ action, isExecuting, onExecute }: ActionCardProps) {
  const executions = action.executions ?? []
  const latestExecution = executions[0] ?? null
  const hasExecutions = executions.length > 0
  const canTrigger = action.trigger_mode === 'manual' && (action.can_execute ?? false)

  return (
    <div className="px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        {/* Left: label + description + trigger badge */}
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="material-symbols-outlined text-primary mt-0.5 flex-shrink-0"
            title={action.trigger_mode === 'automatic' ? 'Auto-triggered' : 'Manual'}
          >
            {triggerIcon[action.trigger_mode] ?? 'settings'}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-on-surface text-sm">{action.label}</p>
              <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                action.trigger_mode === 'automatic'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}>
                {action.trigger_mode}
              </span>
              {action.allow_repeat && (
                <span className="text-[10px] font-medium text-on-surface-variant bg-surface-container border border-outline-variant/40 px-1.5 py-0.5 rounded">
                  repeatable
                </span>
              )}
            </div>
            {action.description && (
              <p className="text-xs text-on-surface-variant mt-0.5">{action.description}</p>
            )}
          </div>
        </div>

        {/* Right: trigger button (manual & can_execute) */}
        {canTrigger && (
          <button
            onClick={() => onExecute(action)}
            disabled={isExecuting}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
                       bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isExecuting ? (
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-sm">send</span>
            )}
            {isExecuting ? 'Sending…' : 'Trigger'}
          </button>
        )}

        {/* Already executed, not repeatable */}
        {!canTrigger && action.trigger_mode === 'manual' && hasExecutions && !action.allow_repeat && (
          <span className="flex-shrink-0 flex items-center gap-1 text-xs text-green-700 font-medium">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Done
          </span>
        )}
      </div>

      {/* Latest status badge for auto-triggered */}
      {action.trigger_mode === 'automatic' && latestExecution && (
        <div className="mt-2 ml-9">
          <ExecutionBadge execution={latestExecution} />
        </div>
      )}

      {/* Full execution history (collapsible when >1 execution) */}
      {hasExecutions && (
        <ExecutionHistory executions={executions} />
      )}
    </div>
  )
}

// ==========================================================================
// ExecutionBadge — compact status chip
// ==========================================================================

function ExecutionBadge({ execution }: { execution: TransitionActionExecution }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${statusStyle[execution.status] ?? ''}`}>
      <span className="material-symbols-outlined text-[12px]">
        {execution.status === 'success' ? 'check' : execution.status === 'failed' ? 'close' : 'hourglass_empty'}
      </span>
      {execution.status}
    </span>
  )
}

// ==========================================================================
// ExecutionHistory — audit trail table
// ==========================================================================

function ExecutionHistory({ executions }: { executions: TransitionActionExecution[] }) {
  const [expanded, setExpanded] = useState(false)

  if (executions.length === 0) return null

  // Show only the most recent execution unless expanded
  const visible = expanded ? executions : [executions[0]]

  return (
    <div className="mt-3 ml-9">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-on-surface-variant uppercase tracking-wide text-[10px]">
            <th className="text-left pb-1 w-24">Status</th>
            <th className="text-left pb-1 w-24">By</th>
            <th className="text-left pb-1 w-20">Type</th>
            <th className="text-left pb-1">When</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {visible.map(ex => (
            <tr key={ex.id} className="leading-6">
              <td><ExecutionBadge execution={ex} /></td>
              <td className="text-on-surface pr-2">{ex.triggered_by || '—'}</td>
              <td className="text-on-surface-variant pr-2">{ex.trigger_type}</td>
              <td className="text-on-surface-variant">
                {new Date(ex.executed_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Expand/collapse if more than one execution */}
      {executions.length > 1 && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-1 text-[11px] text-primary hover:underline font-medium"
        >
          {expanded ? 'Show less' : `Show all ${executions.length} executions`}
        </button>
      )}
    </div>
  )
}
