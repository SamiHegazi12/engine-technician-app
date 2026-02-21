import React, { useState } from 'react';
import { RepairAgreement, RepairStatus } from '@/types';
import { RIYAL_SYMBOL } from '@/config/constants';

interface Props {
  agreements: RepairAgreement[];
  onNew: () => void;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: RepairStatus) => void;
  onDelete: (ids: string[]) => void;
}

const ControlPanel: React.FC<Props> = ({ agreements, onNew, onEdit, onStatusChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handlePdfExport = () => {
    const selectedAgreements = agreements.filter(a => selectedIds.includes(a.id));
    if (selectedAgreements.length === 0) {
      alert('يرجى اختيار إتفاقية واحدة على الأقل');
      return;
    }
    window.print(); // Using browser print as a simple way to generate PDF of the current view
  };

  const filtered = agreements.filter(a => 
    a.customer.fullName.includes(searchTerm) || 
    a.vehicle.plateNumbers.includes(searchTerm) || 
    a.serialNumber.includes(searchTerm) || 
    a.customer.phone.includes(searchTerm)
  );

  const getStatusColor = (status: RepairStatus) => {
    switch(status) {
      case 'جديد': return 'bg-blue-100 text-blue-700';
      case 'قيد العمل': return 'bg-yellow-100 text-yellow-700';
      case 'في إنتظار القطع': return 'bg-orange-100 text-orange-700';
      case 'مكتمل': return 'bg-pink-100 text-pink-700';
      case 'تم التسليم': return 'bg-green-100 text-green-700';
      case 'ملغي': return 'bg-red-600 text-white';
      case 'مؤرشف': return 'bg-gray-600 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleWhatsApp = (agreement: RepairAgreement) => {
    let phone = agreement.customer.phone;
    if (phone.startsWith('05')) phone = '966' + phone.substring(1);
    
    const subtotal = agreement.claims.reduce((acc, c) => acc + c.cost, 0);
    const total = subtotal * (1 - agreement.discountPercent / 100);
    
    let message = `مرحباً ${agreement.customer.fullName}، إليك تفاصيل إتفاقية إصلاح الخاصة بك رقم ${agreement.serialNumber}. الإجمالي: ${total.toFixed(2)} ${RIYAL_SYMBOL}`;
    
    if (agreement.repairAgreementLink) {
      message += `\nرابط الإتفاقية: ${agreement.repairAgreementLink}`;
    }
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  
  const handleExport = () => {
    const dataStr = JSON.stringify(agreements, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `repair_agreements_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; border-bottom: 1px dashed #ccc; padding-bottom: 20px; margin-bottom: 20px; }
        }
      `}} />
      
      {/* PDF Print View */}
      <div className="print-section hidden print:block" dir="rtl">
        <h1 className="text-2xl font-bold text-center mb-6 border-b pb-4">تقرير إتفاقيات الإصلاح - مركز تقني المحركات</h1>
        {agreements.filter(a => selectedIds.includes(a.id)).map((agreement) => {
          const subtotal = agreement.claims.reduce((acc, c) => acc + c.cost, 0);
          const total = subtotal * (1 - agreement.discountPercent / 100);
          return (
            <div key={agreement.id} className="page-break p-4 space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-lg">رقم العقد: {agreement.serialNumber}</span>
                <span className="text-blue-600 font-bold">{agreement.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-right">
                <div><strong>العميل:</strong> {agreement.customer.fullName}</div>
                <div><strong>الجوال:</strong> {agreement.customer.phone}</div>
                <div><strong>السيارة:</strong> {agreement.vehicle.type} {agreement.vehicle.model}</div>
                <div><strong>اللوحة:</strong> {agreement.vehicle.plateLetters} | {agreement.vehicle.plateNumbers}</div>
                <div><strong>تاريخ الإنشاء:</strong> {new Date(agreement.createdAt).toLocaleDateString('en-GB')}</div>
                <div><strong>رقم البطاقة:</strong> {agreement.jobCardNumber || '---'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded border text-right">
                <h4 className="text-xs font-bold mb-1">الشكاوى والملاحظات:</h4>
                <div className="space-y-1">
                  {agreement.claims.map((c, i) => (
                    <div key={i} className="text-xs">• {c.description}</div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xl font-bold text-green-600">
                  إجمالي المبلغ: {total.toFixed(2)} ر.س
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main UI */}
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pb-24 no-print">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-blue-900">مركز تقني المحركات</h1>
            <p className="text-gray-500">لوحة التحكم والمتابعة الرقمية</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-200 transition-all flex items-center gap-2">💾 نسخة احتياطية</button>
            <button onClick={onNew} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
              <span>+</span> إنشاء إتفاقية جديدة
            </button>
          </div>
        </header>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="relative">
            <input 
              type="text" 
              placeholder="البحث بالاسم، رقم اللوحة، الجوال، أو رقم العقد..." 
              className="w-full pl-12 pr-4 py-3 rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-right" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
            <span className="absolute right-3 top-3.5 text-gray-400">🔍</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(agreement => {
            const subtotal = agreement.claims.reduce((acc, c) => acc + c.cost, 0);
            const total = subtotal * (1 - agreement.discountPercent / 100);
            const creationDate = agreement.createdAt ? new Date(agreement.createdAt).toLocaleString('en-GB', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : '---';

            return (
              <div key={agreement.id} className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-5 space-y-4 ${selectedIds.includes(agreement.id) ? "ring-2 ring-blue-500 border-transparent" : ""}`}>
                <div className="flex justify-between items-start">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(agreement.id)} 
                    onChange={() => toggleSelect(agreement.id)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-gray-50 px-2 py-1 rounded text-[10px] font-mono text-gray-400">
                      {agreement.serialNumber}
                    </div>
                    <select 
                      className={`text-xs font-bold px-2 py-1 rounded-full outline-none border-none ${getStatusColor(agreement.status)}`} 
                      value={agreement.status} 
                      onChange={e => onStatusChange(agreement.id, e.target.value as RepairStatus)}
                    >
                      {Object.values(RepairStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-gray-900 truncate">{agreement.customer.fullName}</h3>
                  <p className="text-sm text-gray-500" dir="ltr">{agreement.customer.phone}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 py-2 border-y border-gray-50 text-xs text-right" dir="rtl">
                  <div>
                    <span className="text-gray-400 block">السيارة</span>
                    <span className="font-medium">{agreement.vehicle.type} {agreement.vehicle.model}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">اللوحة</span>
                    <span className="font-medium" dir="ltr">{agreement.vehicle.plateLetters} | {agreement.vehicle.plateNumbers}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">تاريخ الإنشاء</span>
                    <span className="font-medium text-blue-600">{creationDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">رقم البطاقة</span>
                    <span className="font-medium">{agreement.jobCardNumber || '---'}</span>
                  </div>
                </div>

                {/* Claims Section */}
                {agreement.claims && agreement.claims.length > 0 && (
                  <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                    <span className="text-[10px] text-blue-400 block mb-1">الشكاوى والملاحظات</span>
                    <div className="space-y-1">
                      {agreement.claims.map((claim, idx) => (
                        <div key={claim.id || idx} className="text-[11px] text-gray-700 flex items-start gap-1">
                          <span className="text-blue-500">•</span>
                          <span className="truncate">{claim.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {agreement.signature && (
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <p className="text-[10px] text-gray-400 mb-1 text-right">توقيع العميل (موافق على الشروط)</p>
                    <div className="bg-white rounded border h-16 flex items-center justify-center overflow-hidden">
                      <img src={agreement.signature} alt="Customer Signature" className="max-h-full object-contain" />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-bold text-green-600">
                    {total.toFixed(2)} <span className="text-[10px] text-gray-400">ر.س</span>
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(agreement.id)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                      عرض / تعديل
                    </button>
                    <button onClick={() => handleWhatsApp(agreement)} className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors">
                      💬
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="text-6xl">📋</div>
              <p className="text-gray-400">لا توجد إتفاقيات إصلاح تطابق بحثك حالياً</p>
            </div>
          )}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white border shadow-2xl rounded-2xl p-4 flex items-center gap-6 z-50 no-print">
          <span className="text-sm font-bold text-blue-900">{selectedIds.length} مختارة</span>
          <div className="h-6 w-px bg-gray-200" />
          <button onClick={handlePdfExport} className="text-blue-600 font-bold text-sm flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
            📄 تصدير PDF
          </button>
          <button onClick={() => { if(window.confirm("هل أنت متأكد من حذف الاتفاقيات المختارة؟")) { onDelete(selectedIds); setSelectedIds([]); } }} className="text-red-600 font-bold text-sm flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer bg-red-50/50 border border-red-100 shadow-sm">
            🗑️ حذف نهائي
          </button>
          <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}
    </>
  );
};

export default ControlPanel;
