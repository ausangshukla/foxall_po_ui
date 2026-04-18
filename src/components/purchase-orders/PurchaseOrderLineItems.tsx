import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  listPurchaseOrderLineItems, 
  createPurchaseOrderLineItem, 
  updatePurchaseOrderLineItem, 
  deletePurchaseOrderLineItem,
  exportPurchaseOrderLineItems
} from '../../api/purchase-order-line-items';
import type { 
  PurchaseOrderLineItemResponse, 
  CreatePurchaseOrderLineItemRequest, 
  UpdatePurchaseOrderLineItemRequest 
} from '../../types/api';
import { PurchaseOrderLineItemForm } from './PurchaseOrderLineItemForm';
import { AlertMessage, LoadingSpinner, ConfirmationModal } from '../common';

type SortField = 'sku_or_part_number' | 'description' | 'quantity_ordered' | 'unit_value' | 'total_value' | 'status';
type SortDirection = 'asc' | 'desc';

interface PurchaseOrderLineItemsProps {
  poId: number;
  canManage: boolean;
  /** Current PO state system_code — drives whether confirmation columns are shown */
  poStateSystemCode?: string | null;
}

// States where the seller has responded — show confirmation columns
const SELLER_CONFIRMED_STATES = ['seller_confirmed', 'seller_confirmed_partial', 'seller_rejected'];

export const PurchaseOrderLineItems: React.FC<PurchaseOrderLineItemsProps> = ({ poId, canManage, poStateSystemCode }) => {
  // Show the confirmed qty/price columns when the seller has already responded
  const showConfirmedColumns = poStateSystemCode
    ? SELLER_CONFIRMED_STATES.includes(poStateSystemCode) ||
      // Also show for any downstream state (picked_up, shipped, received, etc.)
      ['picked_up', 'shipped', 'out_for_delivery', 'received', 'inspection',
       'disputed', 'completed'].includes(poStateSystemCode)
    : false;
  const [lineItems, setLineItems] = useState<PurchaseOrderLineItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('sku_or_part_number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PurchaseOrderLineItemResponse | null>(null);

  // Delete states
  const [itemToDelete, setItemToDelete] = useState<PurchaseOrderLineItemResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLineItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listPurchaseOrderLineItems(poId);
      setLineItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load line items');
    } finally {
      setIsLoading(false);
    }
  }, [poId]);

  useEffect(() => {
    fetchLineItems();
  }, [fetchLineItems]);

  // Get unique statuses for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(lineItems.map(item => item.calculated_status || item.status || 'pending'));
    return Array.from(statuses).sort();
  }, [lineItems]);

  // Filtered and sorted line items
  const filteredLineItems = useMemo(() => {
    let result = [...lineItems];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.sku_or_part_number?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.status?.toLowerCase().includes(query) ||
        item.batch_or_lot_number?.toLowerCase().includes(query) ||
        item.hs_code?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => 
        (item.calculated_status || item.status || 'pending') === statusFilter
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'sku_or_part_number':
          aVal = (a.sku_or_part_number || '').toLowerCase();
          bVal = (b.sku_or_part_number || '').toLowerCase();
          break;
        case 'description':
          aVal = (a.description || '').toLowerCase();
          bVal = (b.description || '').toLowerCase();
          break;
        case 'quantity_ordered':
          aVal = Number(a.quantity_ordered) || 0;
          bVal = Number(b.quantity_ordered) || 0;
          break;
        case 'unit_value':
          aVal = Number(a.unit_value) || 0;
          bVal = Number(b.unit_value) || 0;
          break;
        case 'total_value':
          aVal = Number(a.total_value) || 0;
          bVal = Number(b.total_value) || 0;
          break;
        case 'status':
          aVal = (a.calculated_status || a.status || 'pending').toLowerCase();
          bVal = (b.calculated_status || b.status || 'pending').toLowerCase();
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [lineItems, searchQuery, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="material-symbols-outlined text-xs opacity-40">unfold_more</span>;
    }
    return sortDirection === 'asc' 
      ? <span className="material-symbols-outlined text-xs">expand_less</span>
      : <span className="material-symbols-outlined text-xs">expand_more</span>;
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditClick = (item: PurchaseOrderLineItemResponse) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDeleteClick = (item: PurchaseOrderLineItemResponse) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      await deletePurchaseOrderLineItem(poId, itemToDelete.id);
      setLineItems(prev => prev.filter(item => item.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete line item');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: CreatePurchaseOrderLineItemRequest | UpdatePurchaseOrderLineItemRequest) => {
    if (editingItem) {
      const updated = await updatePurchaseOrderLineItem(poId, editingItem.id, data as UpdatePurchaseOrderLineItemRequest);
      setLineItems(prev => prev.map(item => item.id === updated.id ? updated : item));
    } else {
      const created = await createPurchaseOrderLineItem(poId, data as CreatePurchaseOrderLineItemRequest);
      setLineItems(prev => [...prev, created]);
    }
  };

  const handleExport = async () => {
    try {
      await exportPurchaseOrderLineItems(poId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export line items');
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'received': return 'bg-green-100 text-green-700 border-green-200';
      case 'partially_received': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'in_transit': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'in_production': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'ready_for_pickup': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading && lineItems.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">format_list_bulleted</span>
          <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Line Items</h2>
          <span className="px-2.5 py-0.5 bg-primary-container text-on-primary-container rounded-full text-[10px] font-extrabold">
            {lineItems.length} ITEMS
          </span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-secondary-container text-on-secondary-container font-bold rounded-lg shadow hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-sm">file_download</span>
            Export
          </button>
          {canManage && (
            <button
              onClick={handleAddClick}
              className="px-6 py-2 bg-primary text-on-primary font-bold rounded-lg shadow hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Item
            </button>
          )}
        </div>
      </div>

      {error && <AlertMessage variant="danger" message={error} onClose={() => setError(null)} />}

      {lineItems.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-xl border border-dashed border-outline-variant/50">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-4">inventory</span>
          <p className="text-on-surface-variant font-medium">No line items added to this purchase order yet.</p>
          {canManage && (
            <button
              onClick={handleAddClick}
              className="mt-4 text-primary font-bold hover:underline inline-flex items-center gap-1"
            >
              Add the first item
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between glass-panel rounded-xl border border-outline-variant/20 p-4">
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                <input
                  type="text"
                  id="line-items-search"
                  placeholder="Search SKU, description, lot #, HS code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white"
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                  className="px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-all"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          {(searchQuery || statusFilter !== 'all') && (
            <p className="text-sm text-on-surface-variant">
              Showing <span className="font-bold">{filteredLineItems.length}</span> of {lineItems.length} items
            </p>
          )}

          {/* Table */}
          <div className="overflow-x-auto glass-panel rounded-xl border border-outline-variant/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30">
                  <th 
                    className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest cursor-pointer hover:bg-primary/5 transition-colors select-none"
                    onClick={() => handleSort('sku_or_part_number')}
                  >
                    <div className="flex items-center gap-1">
                      SKU/Part # {getSortIcon('sku_or_part_number')}
                    </div>
                  </th>
                  <th 
                    className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest cursor-pointer hover:bg-primary/5 transition-colors select-none"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center gap-1">
                      Description {getSortIcon('description')}
                    </div>
                  </th>
                  <th 
                    className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-center cursor-pointer hover:bg-primary/5 transition-colors select-none"
                    onClick={() => handleSort('quantity_ordered')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Qty {getSortIcon('quantity_ordered')}
                    </div>
                  </th>
                  <th 
                    className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right cursor-pointer hover:bg-primary/5 transition-colors select-none"
                    onClick={() => handleSort('unit_value')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Unit Value {getSortIcon('unit_value')}
                    </div>
                  </th>
                  <th 
                    className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right cursor-pointer hover:bg-primary/5 transition-colors select-none"
                    onClick={() => handleSort('total_value')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total Value {getSortIcon('total_value')}
                    </div>
                  </th>
                  <th
                    className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-center cursor-pointer hover:bg-primary/5 transition-colors select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Status {getSortIcon('status')}
                    </div>
                  </th>
                  {/*
                    Seller confirmation columns — only shown once the seller
                    has submitted their response. Highlighted in amber to draw
                    attention to any values that differ from the original.
                  */}
                  {showConfirmedColumns && (
                    <>
                      <th className="p-4 text-[10px] font-bold text-amber-700 uppercase tracking-widest text-right bg-amber-50/40">
                        Confirmed Qty
                      </th>
                      <th className="p-4 text-[10px] font-bold text-amber-700 uppercase tracking-widest text-right bg-amber-50/40">
                        Confirmed Price
                      </th>
                      <th className="p-4 text-[10px] font-bold text-amber-700 uppercase tracking-widest bg-amber-50/40">
                        Seller Notes
                      </th>
                    </>
                  )}
                  {canManage && <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredLineItems.length === 0 ? (
                  <tr>
                    <td colSpan={(canManage ? 7 : 6) + (showConfirmedColumns ? 3 : 0)} className="p-12 text-center">
                      <span className="material-symbols-outlined text-4xl text-outline-variant mb-4 block">search_off</span>
                      <p className="text-on-surface-variant font-medium">No items match your search criteria.</p>
                      <button
                        onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                        className="mt-2 text-primary font-bold hover:underline"
                      >
                        Clear filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredLineItems.map((item) => {
                    // A row is "changed" if the seller submitted different values
                    // from what the buyer originally ordered. Highlighted in amber.
                    const confirmedQtyChanged =
                      item.seller_confirmed_quantity !== null &&
                      Number(item.seller_confirmed_quantity) !== Number(item.quantity_ordered)
                    const confirmedPriceChanged =
                      item.seller_confirmed_unit_price !== null &&
                      item.unit_value !== null &&
                      Number(item.seller_confirmed_unit_price) !== Number(item.unit_value)
                    const rowHasChanges = confirmedQtyChanged || confirmedPriceChanged

                    return (
                    <tr
                      key={item.id}
                      className={`hover:bg-primary/5 transition-colors ${rowHasChanges ? 'bg-amber-50/60' : ''}`}
                    >
                      <td className="p-4 align-top">
                        <span className="font-bold text-on-surface">{item.sku_or_part_number || '—'}</span>
                        {item.is_dangerous_goods && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-error text-[12px]">warning</span>
                            <span className="text-[10px] text-error font-bold">DG: {item.un_number}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <p className="text-sm text-on-surface-variant line-clamp-2 max-w-md">{item.description || '—'}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {item.batch_or_lot_number && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-surface-container-high rounded font-medium text-on-surface-variant">
                              LOT: {item.batch_or_lot_number}
                            </span>
                          )}
                          {item.expiry_date && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-surface-container-high rounded font-medium text-on-surface-variant">
                              EXP: {new Date(item.expiry_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-top text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-on-surface">{item.quantity_ordered}</span>
                          <div className="flex gap-2 text-[10px] font-medium text-on-surface-variant">
                            <span className="text-blue-600">{item.quantity_shipped} SHP</span>
                            <span className="text-green-600">{item.quantity_received} REC</span>
                          </div>
                          <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold">{item.unit_of_measure}</span>
                        </div>
                      </td>
                      <td className="p-4 align-top text-right">
                        <span className="text-sm font-medium text-on-surface">
                          {item.currency} {Number(item.unit_value).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 align-top text-right">
                        <span className="text-sm font-bold text-primary">
                          {item.currency} {Number(item.total_value).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 align-top text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(item.calculated_status || item.status)}`}>
                          {(item.calculated_status || item.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      {/* Seller confirmation columns — amber background when changed */}
                      {showConfirmedColumns && (
                        <>
                          <td className={`p-4 align-top text-right ${confirmedQtyChanged ? 'bg-amber-100/60' : 'bg-amber-50/30'}`}>
                            {item.seller_confirmed_quantity !== null ? (
                              <span className={`text-sm font-medium ${confirmedQtyChanged ? 'text-amber-800 font-bold' : 'text-on-surface'}`}>
                                {Number(item.seller_confirmed_quantity).toFixed(3).replace(/\.?0+$/, '')}
                                {confirmedQtyChanged && (
                                  <span className="ml-1 text-[9px] text-amber-600 font-bold">
                                    (was {item.quantity_ordered})
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant text-xs italic">—</span>
                            )}
                          </td>
                          <td className={`p-4 align-top text-right ${confirmedPriceChanged ? 'bg-amber-100/60' : 'bg-amber-50/30'}`}>
                            {item.seller_confirmed_unit_price !== null ? (
                              <span className={`text-sm font-medium ${confirmedPriceChanged ? 'text-amber-800 font-bold' : 'text-on-surface'}`}>
                                {item.currency} {Number(item.seller_confirmed_unit_price).toFixed(2)}
                                {confirmedPriceChanged && (
                                  <span className="ml-1 text-[9px] text-amber-600 font-bold">
                                    (was {item.currency} {Number(item.unit_value).toFixed(2)})
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant text-xs italic">—</span>
                            )}
                          </td>
                          <td className="p-4 align-top bg-amber-50/30">
                            <span className="text-xs text-on-surface-variant italic">
                              {item.seller_confirmation_notes || '—'}
                            </span>
                          </td>
                        </>
                      )}
                      {canManage && (
                        <td className="p-4 align-top text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-primary-container/20 hover:text-primary transition-all"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-error-container/20 hover:text-error transition-all"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <PurchaseOrderLineItemForm
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        title={editingItem ? 'Modify Line Item' : 'New Line Item'}
      />

      <ConfirmationModal
        show={!!itemToDelete}
        title="Confirm Deletion"
        message={
          <>
            Are you sure you want to delete line item <span className="font-bold">"{itemToDelete?.sku_or_part_number}"</span>?
            This action cannot be undone.
          </>
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
        isLoading={isDeleting}
        confirmText="Delete Item"
        variant="danger"
      />
    </div>
  );
};
