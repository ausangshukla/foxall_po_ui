import React, { useState, useEffect } from 'react';
import { Modal, AlertMessage } from '../common';
import type {
  PurchaseOrderLineItemResponse,
  CreatePurchaseOrderLineItemRequest,
  UpdatePurchaseOrderLineItemRequest,
} from '../../types/api';

interface PurchaseOrderLineItemFormProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePurchaseOrderLineItemRequest | UpdatePurchaseOrderLineItemRequest) => Promise<void>;
  initialData?: PurchaseOrderLineItemResponse | null;
  title: string;
}

const UNIT_OF_MEASURE_OPTIONS = ['PCS', 'CTN', 'PLT', 'KG', 'CBM', 'L', 'TONS'];
const WEIGHT_UNIT_OPTIONS = ['kg', 'lbs'];
const VOLUME_UNIT_OPTIONS = ['cbm', 'cft'];
const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD'];
const STATUS_OPTIONS = [
  'pending',
  'in_production',
  'ready_for_pickup',
  'in_transit',
  'partially_received',
  'received',
  'cancelled',
];

export const PurchaseOrderLineItemForm: React.FC<PurchaseOrderLineItemFormProps> = ({
  show,
  onClose,
  onSubmit,
  initialData,
  title,
}) => {
  const [formData, setFormData] = useState<CreatePurchaseOrderLineItemRequest>({
    sku_or_part_number: '',
    description: '',
    quantity_ordered: 0,
    quantity_shipped: 0,
    quantity_received: 0,
    unit_of_measure: 'PCS',
    net_weight: 0,
    gross_weight: 0,
    weight_unit: 'kg',
    total_volume: 0,
    volume_unit: 'cbm',
    dimension_length: 0,
    dimension_width: 0,
    dimension_height: 0,
    dimension_unit: 'cm',
    hs_code: '',
    country_of_origin: '',
    unit_value: 0,
    total_value: 0,
    currency: 'USD',
    is_dangerous_goods: false,
    un_number: '',
    dg_class: '',
    is_temperature_controlled: false,
    temperature_range: '',
    batch_or_lot_number: '',
    expiry_date: '',
    status: 'pending',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        sku_or_part_number: initialData.sku_or_part_number || '',
        description: initialData.description || '',
        quantity_ordered: initialData.quantity_ordered || 0,
        quantity_shipped: initialData.quantity_shipped || 0,
        quantity_received: initialData.quantity_received || 0,
        unit_of_measure: initialData.unit_of_measure || 'PCS',
        net_weight: initialData.net_weight || 0,
        gross_weight: initialData.gross_weight || 0,
        weight_unit: initialData.weight_unit || 'kg',
        total_volume: initialData.total_volume || 0,
        volume_unit: initialData.volume_unit || 'cbm',
        dimension_length: initialData.dimension_length || 0,
        dimension_width: initialData.dimension_width || 0,
        dimension_height: initialData.dimension_height || 0,
        dimension_unit: initialData.dimension_unit || 'cm',
        hs_code: initialData.hs_code || '',
        country_of_origin: initialData.country_of_origin || '',
        unit_value: initialData.unit_value || 0,
        total_value: initialData.total_value || 0,
        currency: initialData.currency || 'USD',
        is_dangerous_goods: initialData.is_dangerous_goods || false,
        un_number: initialData.un_number || '',
        dg_class: initialData.dg_class || '',
        is_temperature_controlled: initialData.is_temperature_controlled || false,
        temperature_range: initialData.temperature_range || '',
        batch_or_lot_number: initialData.batch_or_lot_number || '',
        expiry_date: initialData.expiry_date ? new Date(initialData.expiry_date).toISOString().split('T')[0] : '',
        status: initialData.status || 'pending',
      });
    } else {
      setFormData({
        sku_or_part_number: '',
        description: '',
        quantity_ordered: 0,
        quantity_shipped: 0,
        quantity_received: 0,
        unit_of_measure: 'PCS',
        net_weight: 0,
        gross_weight: 0,
        weight_unit: 'kg',
        total_volume: 0,
        volume_unit: 'cbm',
        dimension_length: 0,
        dimension_width: 0,
        dimension_height: 0,
        dimension_unit: 'cm',
        hs_code: '',
        country_of_origin: '',
        unit_value: 0,
        total_value: 0,
        currency: 'USD',
        is_dangerous_goods: false,
        un_number: '',
        dg_class: '',
        is_temperature_controlled: false,
        temperature_range: '',
        batch_or_lot_number: '',
        expiry_date: '',
        status: 'pending',
      });
    }
    setError(null);
    setValidationErrors({});
  }, [initialData, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? (value === '' ? 0 : parseFloat(value)) : 
              value,
    }));
    
    // Clear validation error when field changes
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.hs_code && !/^\d{6,10}$/.test(formData.hs_code)) {
      errors.hs_code = 'HS Code must be 6-10 digits';
    }

    if (formData.is_dangerous_goods) {
      if (!formData.un_number) {
        errors.un_number = 'UN Number is required for dangerous goods';
      } else if (!/^UN\d{4}$/.test(formData.un_number)) {
        errors.un_number = 'UN Number must be in format UNxxxx';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = (fieldName: string) => `
    w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all
    ${validationErrors[fieldName] ? 'border-red-500 bg-red-50' : 'border-gray-200'}
  `;

  return (
    <Modal show={show} title={title} onClose={onClose} maxWidth="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <AlertMessage variant="danger" message={error} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-gray-500">Basic Information</h4>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">SKU / Part Number</label>
              <input
                type="text"
                name="sku_or_part_number"
                value={formData.sku_or_part_number || ''}
                onChange={handleChange}
                className={inputClasses('sku_or_part_number')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className={inputClasses('description')}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status || 'pending'}
                  onChange={handleChange}
                  className={inputClasses('status')}
                >
                  {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Origin Country</label>
                <input
                  type="text"
                  name="country_of_origin"
                  value={formData.country_of_origin || ''}
                  onChange={handleChange}
                  className={inputClasses('country_of_origin')}
                />
              </div>
            </div>
          </div>

          {/* Quantities & Values */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-gray-500">Quantities & Financials</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Qty Ordered</label>
                <input
                  type="number"
                  name="quantity_ordered"
                  value={formData.quantity_ordered || 0}
                  onChange={handleChange}
                  className={inputClasses('quantity_ordered')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Qty Shipped</label>
                <input
                  type="number"
                  name="quantity_shipped"
                  value={formData.quantity_shipped || 0}
                  onChange={handleChange}
                  className={inputClasses('quantity_shipped')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Qty Received</label>
                <input
                  type="number"
                  name="quantity_received"
                  value={formData.quantity_received || 0}
                  onChange={handleChange}
                  className={inputClasses('quantity_received')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Unit of Measure</label>
                <select
                  name="unit_of_measure"
                  value={formData.unit_of_measure || 'PCS'}
                  onChange={handleChange}
                  className={inputClasses('unit_of_measure')}
                >
                  {UNIT_OF_MEASURE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Currency</label>
                <select
                  name="currency"
                  value={formData.currency || 'USD'}
                  onChange={handleChange}
                  className={inputClasses('currency')}
                >
                  {CURRENCY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Unit Value</label>
                <input
                  type="number"
                  step="0.01"
                  name="unit_value"
                  value={formData.unit_value || 0}
                  onChange={handleChange}
                  className={inputClasses('unit_value')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Total Value</label>
                <input
                  type="number"
                  step="0.01"
                  name="total_value"
                  value={formData.total_value || 0}
                  onChange={handleChange}
                  className={inputClasses('total_value')}
                />
              </div>
            </div>
          </div>

          {/* Logistics & Dimensions */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-gray-500">Logistics & Specs</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Net Weight</label>
                <input
                  type="number"
                  step="0.01"
                  name="net_weight"
                  value={formData.net_weight || 0}
                  onChange={handleChange}
                  className={inputClasses('net_weight')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Gross Weight</label>
                <input
                  type="number"
                  step="0.01"
                  name="gross_weight"
                  value={formData.gross_weight || 0}
                  onChange={handleChange}
                  className={inputClasses('gross_weight')}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Weight Unit</label>
                <select
                  name="weight_unit"
                  value={formData.weight_unit || 'kg'}
                  onChange={handleChange}
                  className={inputClasses('weight_unit')}
                >
                  {WEIGHT_UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Total Volume</label>
                <input
                  type="number"
                  step="0.001"
                  name="total_volume"
                  value={formData.total_volume || 0}
                  onChange={handleChange}
                  className={inputClasses('total_volume')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Volume Unit</label>
                <select
                  name="volume_unit"
                  value={formData.volume_unit || 'cbm'}
                  onChange={handleChange}
                  className={inputClasses('volume_unit')}
                >
                  {VOLUME_UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Dimensions (L x W x H)</label>
              </div>
              <input
                type="number"
                placeholder="L"
                name="dimension_length"
                value={formData.dimension_length || 0}
                onChange={handleChange}
                className={inputClasses('dimension_length')}
              />
              <input
                type="number"
                placeholder="W"
                name="dimension_width"
                value={formData.dimension_width || 0}
                onChange={handleChange}
                className={inputClasses('dimension_width')}
              />
              <input
                type="number"
                placeholder="H"
                name="dimension_height"
                value={formData.dimension_height || 0}
                onChange={handleChange}
                className={inputClasses('dimension_height')}
              />
              <input
                type="text"
                placeholder="Unit"
                name="dimension_unit"
                value={formData.dimension_unit || 'cm'}
                onChange={handleChange}
                className={inputClasses('dimension_unit')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">HS Code (6-10 digits)</label>
              <input
                type="text"
                name="hs_code"
                value={formData.hs_code || ''}
                onChange={handleChange}
                className={inputClasses('hs_code')}
                maxLength={10}
              />
              {validationErrors.hs_code && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.hs_code}</p>}
            </div>
          </div>

          {/* Compliance & Tracking */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-gray-500">Compliance & Batches</h4>
            
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_dangerous_goods"
                  name="is_dangerous_goods"
                  checked={formData.is_dangerous_goods || false}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_dangerous_goods" className="text-sm font-bold text-gray-700">Dangerous Goods</label>
              </div>
              
              {formData.is_dangerous_goods && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">UN Number (UNxxxx)</label>
                    <input
                      type="text"
                      name="un_number"
                      placeholder="UN1234"
                      value={formData.un_number || ''}
                      onChange={handleChange}
                      className={inputClasses('un_number')}
                    />
                    {validationErrors.un_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.un_number}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">DG Class</label>
                    <input
                      type="text"
                      name="dg_class"
                      value={formData.dg_class || ''}
                      onChange={handleChange}
                      className={inputClasses('dg_class')}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_temperature_controlled"
                  name="is_temperature_controlled"
                  checked={formData.is_temperature_controlled || false}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_temperature_controlled" className="text-sm font-bold text-gray-700">Temp. Controlled</label>
              </div>
              
              {formData.is_temperature_controlled && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Temperature Range</label>
                  <input
                    type="text"
                    name="temperature_range"
                    placeholder="e.g. 2-8°C"
                    value={formData.temperature_range || ''}
                    onChange={handleChange}
                    className={inputClasses('temperature_range')}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Batch / Lot #</label>
                <input
                  type="text"
                  name="batch_or_lot_number"
                  value={formData.batch_or_lot_number || ''}
                  onChange={handleChange}
                  className={inputClasses('batch_or_lot_number')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Expiry Date</label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date || ''}
                  onChange={handleChange}
                  className={inputClasses('expiry_date')}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {initialData ? 'Update Item' : 'Add Line Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
