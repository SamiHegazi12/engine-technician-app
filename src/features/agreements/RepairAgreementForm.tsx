import React, { useState, useEffect } from 'react';
import { RepairAgreement, RepairStatus } from '@/types';

interface Props {
  initialData?: RepairAgreement;
  onSave: (data: RepairAgreement) => void;
  onBack: () => void;
  agreementsCount: number;
}

const RepairAgreementForm: React.FC<Props> = ({
  initialData,
  onSave,
  onBack,
  agreementsCount
}) => {
  const [formData, setFormData] = useState<RepairAgreement>({
    id: crypto.randomUUID(),
    serialNumber: '',
    createdAt: new Date().toISOString(),
    expectedDeliveryDate: '',
    jobCardNumber: '',
    vinNumber: '', // ✅ RESTORED
    vehicle: {
      plate: '',
      model: ''
    },
    customer: {
      name: '',
      phone: ''
    },
    claims: [],
    discountPercent: 0,
    photos: [],
    signature: null,
    status: 'NEW' as RepairStatus,
    termsAccepted: false,
    repairAgreementLink: null
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const year = new Date().getFullYear();
      const nextSerial = `${year}-${agreementsCount + 1}`;
      setFormData(prev => ({
        ...prev,
        serialNumber: nextSerial
      }));
    }
  }, [initialData, agreementsCount]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form className="space-y-4 p-4">
      {/* CUSTOMER */}
      <div className="text-right">
        <label className="block text-sm mb-1 font-bold text-gray-600 print:text-[8px]">اسم العميل</label>
        <input
          type="text"
          value={formData.customer.name}
          onChange={e =>
            setFormData({ ...formData, customer: { ...formData.customer, name: e.target.value } })
          }
          className="w-full border rounded p-2 text-right print:border-none print:p-0"
        />
      </div>

      <div className="text-right">
        <label className="block text-sm mb-1 font-bold text-gray-600 print:text-[8px]">رقم الهاتف</label>
        <input
          type="text"
          value={formData.customer.phone}
          onChange={e =>
            setFormData({ ...formData, customer: { ...formData.customer, phone: e.target.value } })
          }
          className="w-full border rounded p-2 text-right print:border-none print:p-0"
        />
      </div>

      {/* VEHICLE */}
      <div className="text-right">
        <label className="block text-sm mb-1 font-bold text-gray-600 print:text-[8px]">رقم اللوحة</label>
        <input
          type="text"
          value={formData.vehicle.plate}
          onChange={e =>
            setFormData({ ...formData, vehicle: { ...formData.vehicle, plate: e.target.value } })
          }
          className="w-full border rounded p-2 text-right print:border-none print:p-0"
        />
      </div>

      <div className="text-right">
        <label className="block text-sm mb-1 font-bold text-gray-600 print:text-[8px]">موديل السيارة</label>
        <input
          type="text"
          value={formData.vehicle.model}
          onChange={e =>
            setFormData({ ...formData, vehicle: { ...formData.vehicle, model: e.target.value } })
          }
          className="w-full border rounded p-2 text-right print:border-none print:p-0"
        />
      </div>

      {/* JOB CARD */}
      <div className="text-right">
        <label className="block text-sm mb-1 font-bold text-gray-600 print:text-[8px]">رقم بطاقة العمل</label>
        <input
          type="text"
          value={formData.jobCardNumber}
          onChange={e => handleChange('jobCardNumber', e.target.value)}
          className="w-full border rounded p-2 text-right print:border-none print:p-0"
        />
      </div>

      {/* ✅ VIN FIELD */}
      <div className="text-right">
        <label className="block text-sm mb-1 font-bold text-gray-600 print:text-[8px]">
          VIN Number / رقم الهيكل
        </label>
        <input
          type="text"
          value={formData.vinNumber}
          onChange={e => handleChange('vinNumber', e.target.value)}
          className="w-full border rounded p-2 text-right print:border-none print:p-0"
          placeholder="أدخل رقم الهيكل"
        />
      </div>

      {/* DELIVERY DATE */}
      <div className="text-right">
        <label className="block text-sm mb-1 font-bold text-gray-600 print:text-[8px]">تاريخ التسليم المتوقع</label>
        <input
          type="date"
          value={formData.expectedDeliveryDate}
          onChange={e => handleChange('expectedDeliveryDate', e.target.value)}
          className="w-full border rounded p-2 text-right print:border-none print:p-0"
        />
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={() => onSave(formData)}
          className="flex-1 bg-blue-600 text-white font-bold py-2 rounded"
        >
          حفظ الاتفاقية
        </button>
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-300 text-black font-bold py-2 rounded"
        >
          رجوع
        </button>
      </div>
    </form>
  );
};

export default RepairAgreementForm;
