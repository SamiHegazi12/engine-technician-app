import React, { useState } from 'react';
import { RepairAgreement, RepairStatus } from '@/types';
import { RIYAL_SYMBOL } from '@/config/constants';

interface Props {
  agreements: RepairAgreement[];
  onNew: () => void;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: RepairStatus) => void;
}

const ControlPanel: React.FC<Props> = ({ agreements, onNew, onEdit, onStatusChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = agreements.filter(a => a.customer.fullName.includes(searchTerm) || a.vehicle.plateNumbers.includes(searchTerm) || a.serialNumber.includes(searchTerm) || a.customer.phone.includes(searchTerm));

  const getStatusColor = (status: RepairStatus) => {
    switch(status) {
      case RepairStatus.NEW: return 'bg-blue-100 text-blue-700';
      case RepairStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-700';
      case RepairStatus.WAITING_PARTS: return 'bg-orange-100 text-orange-700';
      case RepairStatus.COMPLETED: return 'bg-green-100 text-green-700';
      case RepairStatus.DELIVERED: return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleWhatsApp = (agreement: RepairAgreement) => {
    let phone = agreement.customer.phone;
    if (phone.startsWith('05')) phone = '966' + phone.substring(1);
    const message = `مرحباً ${agreement.customer.fullName}، إليك تفاصيل عقد الصيانة الخاص بك رقم ${agreement.serialNumber}. الإجمالي: ${agreement.claims.reduce((acc, c) => acc + c.cost, 0).toFixed(2)} ر.س`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pb-24 no-print">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div><h1 className="text-2xl font-black text-blue-900">مركز تقني المحركات</h1><p className="text-gray-500">لوحة التحكم والمتابعة الرقمية</p></div>
        <button onClick={onNew} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"><span>+</span> إنشاء عقد جديد</button>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="relative"><input type="text" placeholder="البحث بالاسم، رقم اللوحة، الجوال، أو رقم العقد..." className="w-full pl-12 pr-4 py-3 rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-100 transition-all outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /><span className="absolute right-3 top-3.5 text-gray-400">🔍</span></div></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map(agreement => {
        const total = agreement.claims.reduce((acc, c) => acc + c.cost, 0) * (1 - agreement.discountPercent / 100);
        return (
          <div key={agreement.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-5 space-y-4">
            <div className="flex justify-between items-start"><div className="bg-gray-50 px-2 py-1 rounded text-[10px] font-mono text-gray-400">{agreement.serialNumber}</div><select className={`text-xs font-bold px-2 py-1 rounded-full outline-none border-none ${getStatusColor(agreement.status)}`} value={agreement.status} onChange={e => onStatusChange(agreement.id, e.target.value as RepairStatus)}>{Object.values(RepairStatus).map(s => (<option key={s} value={s}>{s}</option>))}</select></div>
            <div><h3 className="font-bold text-gray-900 truncate text-right">{agreement.customer.fullName}</h3><p className="text-sm text-gray-500 text-right" dir="ltr">{agreement.customer.phone}</p></div>
            <div className="grid grid-cols-2 gap-2 py-2 border-y border-gray-50 text-xs"><div><span className="text-gray-400 block">السيارة</span><span className="font-medium">{agreement.vehicle.type} {agreement.vehicle.model}</span></div><div><span className="text-gray-400 block">اللوحة</span><span className="font-medium" dir="ltr">{agreement.vehicle.plateLetters} | {agreement.vehicle.plateNumbers}</span></div><div><span className="text-gray-400 block">تاريخ التسليم</span><span className="font-medium text-blue-600">{agreement.expectedDeliveryDate || 'غير محدد'}</span></div><div><span className="text-gray-400 block">رقم البطاقة</span><span className="font-medium">{agreement.jobCardNumber || '---'}</span></div></div>
            <div className="flex justify-between items-center pt-2"><span className="text-lg font-bold text-green-600">{total.toFixed(2)} <span className="text-[10px] text-gray-400">{RIYAL_SYMBOL}</span></span><div className="flex gap-2"><button onClick={() => onEdit(agreement.id)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">عرض / تعديل</button><button onClick={() => handleWhatsApp(agreement)} className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors" title="Send WhatsApp">💬</button></div></div>
          </div>
        );
      })}
      {filtered.length === 0 && <div className="col-span-full py-20 text-center space-y-4"><div className="text-6xl">📋</div><p className="text-gray-400">لا توجد عقود صيانة تطابق بحثك حالياً</p></div>}
      </div>
    </div>
  );
};

export default ControlPanel;