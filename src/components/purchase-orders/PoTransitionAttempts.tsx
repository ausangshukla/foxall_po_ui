import React, { useState, useEffect, useCallback } from 'react';
import poTransitionAttemptApi from '../../api/po-transition-attempts';
import type { PoTransitionAttemptResponse } from '../../types/api';
import { AlertMessage, LoadingSpinner } from '../common';

interface PoTransitionAttemptsProps {
  poId: number;
}

export const PoTransitionAttempts: React.FC<PoTransitionAttemptsProps> = ({ poId }) => {
  const [attempts, setAttempts] = useState<PoTransitionAttemptResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await poTransitionAttemptApi.getByPurchaseOrder(poId);
      if (response.data) {
        setAttempts(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transition attempts');
    } finally {
      setIsLoading(false);
    }
  }, [poId]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'system_error':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  if (isLoading && attempts.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">history</span>
          <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Transition History</h2>
          <span className="px-2.5 py-0.5 bg-primary-container text-on-primary-container rounded-full text-[10px] font-extrabold uppercase">
            {attempts.length} Attempts
          </span>
        </div>
        <button
          onClick={fetchAttempts}
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
          title="Refresh"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
        </button>
      </div>

      {error && <AlertMessage variant="danger" message={error} onClose={() => setError(null)} />}

      {attempts.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-xl border border-dashed border-outline-variant/50">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-4">history</span>
          <p className="text-on-surface-variant font-medium">No transition attempts recorded for this purchase order.</p>
        </div>
      ) : (
        <div className="overflow-x-auto glass-panel rounded-xl border border-outline-variant/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30">
                <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Date & Time</th>
                <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Action</th>
                <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">From / To State</th>
                <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-center">Status</th>
                <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Actor</th>
                <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Notes / Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-primary/5 transition-colors">
                  <td className="p-4 align-top">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface">
                        {new Date(attempt.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(attempt.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <span className="text-sm font-bold text-primary uppercase tracking-tight">
                      {(attempt.attempted_action || (attempt as any).action || 'Unknown').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-surface-container-high rounded text-on-surface-variant">
                          {(attempt.from_state_system_code || (attempt as any).from_state || 'START').toUpperCase()}
                        </span>
                        <span className="material-symbols-outlined text-[10px] text-outline-variant">arrow_forward</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary-container/20 rounded text-primary">
                          {(attempt.to_state_system_code || (attempt as any).to_state || 'END').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(attempt.status)}`}>
                      {attempt.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-on-surface">
                        {attempt.actor_display_name || 'System'}
                      </span>
                      <span className="text-[10px] text-on-surface-variant uppercase">
                        {attempt.actor_type || 'Automation'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="max-w-xs overflow-hidden">
                      {attempt.error_message ? (
                        <p className="text-[11px] text-error font-medium leading-tight">{attempt.error_message}</p>
                      ) : attempt.metadata?.comment ? (
                        <p className="text-[11px] text-on-surface-variant italic leading-tight">
                          "{attempt.metadata.comment as string}"
                        </p>
                      ) : (
                        <span className="text-[11px] text-outline-variant">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
