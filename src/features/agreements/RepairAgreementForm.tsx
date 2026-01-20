
import React, { useState, useEffect, useCallback } from 'react';
import { RepairAgreement, Claim, VehicleData, CustomerData, RepairStatus } from '@/types';
import { CAR_MANUFACTURERS, COLORS, RIYAL_SYMBOL, TERMS_AND_CONDITIONS } from '@/config/constants';
import SignaturePad from '@/components/ui/SignaturePad';
import { extractVehicleInfoFromImage } from '@/lib/gemini';

interface Props {
  initialData?: RepairAgreement;
  onSave: (data: RepairAgreement) => void;
  onBack: () => void;
  agreementsCount?: number;
}

const RepairAgreementForm: React.FC<Props> = ({ initialData, onSave, onBack, agreementsCount = 0 }) => {
  const isEditing = !!initialData;
  const currentYear = new Date().getFullYear().toString();
  const generateSerial = () => {
    const count = (agreementsCount + 1).toString().padStart(4, '0');
    return `${currentYear}${count}`;
  };

  const [formData, setFormData] = useState<RepairAgreement>(initialData || {
    id: crypto.randomUUID(),
    serialNumber: generateSerial(),
    createdAt: new Date().toISOString(),
    expectedDeliveryDate: '',
    jobCardNumber: '',
    vehicle: { type: '', model: '', year: '', odometer: 0, color: '', plateType: 'Saudi', plateLetters: '', plateNumbers: '', vin: '' },
    customer: { fullName: '', phone: '', idNumber: '' },
    claims: [{ id: crypto.randomUUID(), description: '', cost: 0 }],
    discountPercent: 0,
    photos: [],
    signature: '',
    status: RepairStatus.NEW,
    termsAccepted: false
  });

  const [showTerms, setShowTerms] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleHistoryLookup = useCallback((key: 'vin' | 'plateNumbers', value: string) => {
    const history = localStorage.getItem('repair_history');
    if (history) {
      const records: RepairAgreement[] = JSON.parse(history);
      const match = records.find(r => r.vehicle[key] === value);
      if (match) {
        setFormData(prev => ({ ...prev, vehicle: { ...match.vehicle, vin: prev.vehicle.vin, plateNumbers: prev.vehicle.plateNumbers }, customer: match.customer }));
      }
    }
  }, []);

  const handleVINScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resultStr = reader.result as string;
        const base64 = resultStr.split(',')[1];
        const result = await extractVehicleInfoFromImage(base64);
        if (result && Object.values(result).some(v => v !== null)) {
          setFormData(prev => ({
            ...prev,
            vehicle: { 
              ...prev.vehicle, 
              vin: result.vin?.toUpperCase() || prev.vehicle.vin, 
              type: result.brand || prev.vehicle.type, 
              model: result.model?.toUpperCase() || prev.vehicle.model, 
              year: result.year || prev.vehicle.year, 
              color: result.color || prev.vehicle.color,
              plateNumbers: result.plateNumbers || prev.vehicle.plateNumbers,
              plateLetters: result.plateLetters || prev.vehicle.plateLetters
            },
            customer: {
              ...prev.customer,
              fullName: result.customerName || prev.customer.fullName,
              idNumber: result.idNumber || prev.customer.idNumber
            }
          }));
        } else {
          alert("تنبيه: لم يتمكن الذكاء الاصطناعي من استخراج كافة البيانات. يرجى مراجعة الحقول وتعبئتها يدوياً.");
        }
      } catch (err) {
        console.error("Scan processing error:", err);
        alert("حدث خطأ أثناء معالجة الصورة. يرجى المحاولة مرة أخرى بصورة أوضح.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const validateDate = (dateStr: string) => {
    if (!dateStr) return true;
    const selectedDate = new Date(dateStr);
    if (selectedDate.getUTCDay() === 5) {
      alert("عذراً، يوم الجمعة يوم إجازة. يرجى اختيار تاريخ آخر.");
      return false;
    }
    return true;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => { setFormData(prev => ({ ...prev, photos: [...prev.photos, reader.result as string] })); };
      reader.readAsDataURL(file);
    });
  };

  const addClaim = () => { setFormData(prev => ({ ...prev, claims: [...prev.claims, { id: crypto.randomUUID(), description: '', cost: 0 }] })); };
  const subtotal = formData.claims.reduce((acc, c) => acc + c.cost, 0);
  const total = subtotal * (1 - formData.discountPercent / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.signature) { alert("يرجى التوقيع للمتابعة"); return; }
    onSave(formData);
  };

  const handleWhatsAppShare = () => {
    let phone = formData.customer.phone;
    if (phone.startsWith('05')) phone = '966' + phone.substring(1);
    const pdfLink = `https://your-domain.com/view-agreement/${formData.id}`;
    const message = `مرحباً ${formData.customer.fullName}، إليك نسخة من عقد إصلاح سيارتك رقم ${formData.serialNumber}\nيمكنك تحميل العقد من الرابط التالي:\n${pdfLink}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-6 pb-32 print:p-0 print:space-y-1 print:pb-0 text-right" dir="rtl">
      {/* A4 Print Header */}
      <div className="hidden print:flex justify-between items-center border-b-2 border-blue-900 pb-1 mb-1">
        <div className="text-right">
          <h1 className="text-lg font-black text-blue-900">شركة تقني المحركات التجارية</h1>
          <p className="text-[10px] text-gray-600">عقد صيانة وإصلاح مركبة</p>
        </div>
        <div className="text-left">
          <div className="text-sm font-bold text-blue-900">رقم العقد: {formData.serialNumber}</div>
          <div className="text-[10px] text-gray-500">{new Date(formData.createdAt).toLocaleDateString('ar-SA')}</div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm no-print">
        <button type="button" onClick={onBack} className="text-gray-600 flex items-center gap-2 font-bold"><span>→</span> عودة</button>
        <h1 className="text-xl font-bold text-blue-900">عقد صيانة سيارة</h1>
        <div className="text-sm font-medium text-gray-500 font-mono">رقم العقد: {formData.serialNumber}</div>
      </div>

      <div className="grid grid-cols-1 gap-6 print:gap-1">
        <section className="bg-white p-6 rounded-xl shadow-sm space-y-4 border print:border-none print:p-0 print:shadow-none">
          <h2 className="text-lg font-bold border-b pb-2 mb-2 text-blue-900 print:text-xs print:mb-0 print:pb-0">بيانات عقد الإصلاح</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">تاريخ الإنشاء</label>
              <input type="text" value={new Date(formData.createdAt).toLocaleString('en-GB')} disabled className="w-full bg-gray-50 border rounded p-2 text-right text-gray-500 print:bg-white print:border-none print:p-0 print:text-[10px]" />
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">تاريخ التسليم*</label>
              <input type="date" required min={new Date().toISOString().split('T')[0]} value={formData.expectedDeliveryDate} onChange={e => { if (validateDate(e.target.value)) setFormData({...formData, expectedDeliveryDate: e.target.value}); }} className="w-full border rounded p-2 text-right print:border-none print:p-0 print:text-[10px]" />
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">رقم بطاقة العمل</label>
              <input type="text" value={formData.jobCardNumber} onChange={e => setFormData({...formData, jobCardNumber: e.target.value})} className="w-full border rounded p-2 text-right print:border-none print:p-0 print:text-[10px]" placeholder="أدخل الرقم" />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm space-y-4 border print:border-none print:p-0 print:shadow-none">
          <div className="flex flex-col gap-4 border-b pb-2 print:pb-0 print:gap-0">
            <h2 className="text-lg font-bold text-blue-900 print:text-xs">بيانات المركبة</h2>
            <label className="w-full cursor-pointer bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-3 no-print shadow-lg transition-transform active:scale-95">
              {isScanning ? 'جاري المسح...' : '📷 مسح VIN ذكي بالذكاء الاصطناعي'}
              <input type="file" accept="image/*" capture="environment" onChange={handleVINScan} className="hidden" />
            </label>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">رقم الشاصي (VIN)*</label>
              <input type="text" required maxLength={17} value={formData.vehicle.vin} onChange={e => { const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); setFormData({...formData, vehicle: {...formData.vehicle, vin: val}}); if(val.length >= 10) handleHistoryLookup('vin', val); }} className="w-full border-2 border-blue-100 rounded-lg p-3 text-right font-mono text-lg print:border-none print:p-0 print:text-[10px]" placeholder="17 حرفاً ورقم" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">نوع المركبة*</label>
              <input list="manufacturers" required value={formData.vehicle.type} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, type: e.target.value}})} className="w-full border rounded p-2 text-right print:border-none print:p-0 print:text-[10px]" />
              <datalist id="manufacturers">{CAR_MANUFACTURERS.map(m => <option key={m} value={m} />)}</datalist>
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">الموديل*</label>
              <input type="text" required value={formData.vehicle.model} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, model: e.target.value.toUpperCase()}})} className="w-full border rounded p-2 text-right print:border-none print:p-0 print:text-[10px]" />
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">سنة الصنع*</label>
              <input type="number" required min="1950" max="2030" value={formData.vehicle.year} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, year: e.target.value}})} className="w-full border rounded p-2 text-right print:border-none print:p-0 print:text-[10px]" />
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">العداد*</label>
              <input type="text" required value={formData.vehicle.odometer === 0 ? '' : formData.vehicle.odometer} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 6); setFormData({...formData, vehicle: {...formData.vehicle, odometer: parseInt(val) || 0}}); }} className="w-full border rounded p-2 text-right print:border-none print:p-0 print:text-[10px]" placeholder="0" />
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">اللون*</label>
              <select required value={formData.vehicle.color} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, color: e.target.value}})} className="w-full border rounded p-2 text-right print:appearance-none print:border-none print:p-0 print:text-[10px]">
                <option value="">اختر اللون</option>
                {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">اللوحة*</label>
              <div className="flex gap-1 print:text-[10px]">
                <input type="text" required value={formData.vehicle.plateLetters} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, plateLetters: e.target.value}})} className="w-1/2 border rounded p-2 text-center print:border-none print:p-0" placeholder="حروف" />
                <input type="text" required value={formData.vehicle.plateNumbers} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, plateNumbers: e.target.value}})} className="w-1/2 border rounded p-2 text-center print:border-none print:p-0" placeholder="أرقام" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm space-y-4 border print:border-none print:p-0 print:shadow-none">
          <h2 className="text-lg font-bold border-b pb-2 mb-2 text-blue-900 print:text-xs print:mb-0 print:pb-0">بيانات العميل</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
            <div className="text-right"><label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">اسم العميل*</label><input type="text" required value={formData.customer.fullName} onChange={e => setFormData({...formData, customer: {...formData.customer, fullName: e.target.value}})} className="w-full border rounded p-2 text-right font-bold print:border-none print:p-0 print:text-[10px]" /></div>
            <div className="text-right"><label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">رقم الجوال*</label><input type="tel" required pattern="05[0-9]{8}" maxLength={10} value={formData.customer.phone} onChange={e => setFormData({...formData, customer: {...formData.customer, phone: e.target.value.replace(/\D/g, '')}})} className="w-full border rounded p-2 text-right font-bold print:border-none print:p-0 print:text-[10px]" /></div>
            <div className="text-right"><label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">رقم الهوية*</label><input type="text" required pattern="[12][0-9]{9}" maxLength={10} value={formData.customer.idNumber} onChange={e => setFormData({...formData, customer: {...formData.customer, idNumber: e.target.value.replace(/\D/g, '')}})} className="w-full border rounded p-2 text-right font-bold print:border-none print:p-0 print:text-[10px]" /></div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm space-y-4 border print:border-none print:p-0 print:shadow-none">
          <div className="flex justify-between items-center border-b pb-2 print:pb-0"><h2 className="text-lg font-bold text-blue-900 print:text-xs">الطلبات والأعطال</h2><button type="button" onClick={addClaim} className="text-blue-600 text-sm font-bold no-print">+ إضافة طلب</button></div>
          <div className="space-y-2 print:space-y-0">{formData.claims.map((claim, idx) => (
            <div key={claim.id} className="flex gap-2 items-center">
              <input className="flex-grow border rounded p-2 text-right print:border-none print:p-0 print:text-[10px]" placeholder={`طلب #${idx + 1}`} value={claim.description} onChange={e => { const n = [...formData.claims]; n[idx].description = e.target.value; setFormData({...formData, claims: n}); }} />
              <div className="w-24 relative"><input type="number" className="w-full border rounded p-2 pr-8 text-right font-bold print:border-none print:p-0 print:text-[10px]" value={claim.cost === 0 ? '' : claim.cost} onChange={e => { const n = [...formData.claims]; n[idx].cost = parseFloat(e.target.value) || 0; setFormData({...formData, claims: n}); }} /><span className="absolute left-2 top-2 text-gray-400 text-xs print:hidden">{RIYAL_SYMBOL}</span></div>
            </div>
          ))}</div>
          <div className="pt-2 space-y-1 border-t text-left print:pt-0">
            <div className="flex justify-between font-bold print:text-[10px]"><span>{subtotal.toFixed(2)} {RIYAL_SYMBOL}</span><span>المجموع:</span></div>
            <div className="flex justify-between items-center no-print"><input type="number" className="w-20 border rounded p-1 text-center font-bold" value={formData.discountPercent === 0 ? '' : formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: parseFloat(e.target.value) || 0})} /><span>الخصم (%):</span></div>
            <div className="flex justify-between text-xl font-black text-blue-900 pt-1 print:text-xs print:pt-0"><span>{total.toFixed(2)} {RIYAL_SYMBOL}</span><span>الإجمالي النهائي:</span></div>
          </div>
        </section>

        {/* Damage Photos section - Compact for print */}
        <section className="bg-white p-6 rounded-xl shadow-sm space-y-4 border print:border-none print:p-0 print:shadow-none">
          <h2 className="text-lg font-bold border-b pb-2 text-blue-900 print:text-xs print:pb-0 print:mb-0">صور حالة الهيكل</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4 print:gap-1">
            {formData.photos.map((p, idx) => (
              <div key={idx} className="relative aspect-square print:h-16 print:w-16">
                <img src={p} className="w-full h-full object-cover rounded-lg border shadow-sm print:rounded-sm" />
                <button type="button" onClick={() => setFormData({...formData, photos: formData.photos.filter((_, i) => i !== idx)})} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center no-print">✕</button>
              </div>
            ))}
            <label className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 no-print">
              <span className="text-3xl text-gray-400">+</span>
              <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        </section>

        {/* Terms and Signature for Print */}
        <div className="hidden print:block mt-2 space-y-2">
          <div className="text-[8px] text-gray-600 border p-1 rounded bg-gray-50 leading-tight">
            <h3 className="font-bold mb-0 text-blue-900">إقرار العميل:</h3>
            أقر أنا الموقع أدناه بأنني قد اطلعت على كافة الشروط والأحكام الخاصة بشركة تقني المحركات التجارية والمذكورة في هذا العقد، وأوافق عليها جملة وتفصيلاً. كما أقر بصحة البيانات الواردة أعلاه وأفوض المركز بالبدء في أعمال الإصلاح المتفق عليها.
          </div>
          <div className="flex justify-between items-end pt-2">
            <div className="text-center space-y-1">
              <div className="w-24 border-b border-black"></div>
              <div className="font-bold text-[10px]">ختم المركز</div>
            </div>
            <div className="text-center space-y-1">
              {formData.signature && <img src={formData.signature} className="max-h-12 mx-auto mb-0" />}
              <div className="w-24 border-b border-black"></div>
              <div className="font-bold text-[10px]">توقيع العميل</div>
            </div>
          </div>
        </div>

        <div className="no-print space-y-6">
          <div className="flex items-center gap-4 justify-end"><label htmlFor="terms" className="font-bold cursor-pointer">أقر بالموافقة على <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 underline font-black">الشروط والأحكام</button></label><input type="checkbox" id="terms" checked={formData.termsAccepted} onChange={e => setFormData({...formData, termsAccepted: e.target.checked})} className="w-7 h-7 accent-blue-600" /></div>
          {(formData.termsAccepted || isEditing) && (<div className="text-right"><label className="block font-bold mb-4 text-lg">توقيع العميل:</label><SignaturePad onSave={sig => setFormData({...formData, signature: sig})} disabled={isEditing} /></div>)}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 no-print shadow-2xl z-40">
        <div className="max-w-4xl mx-auto flex flex-row-reverse gap-4">
          <button type="submit" className="flex-grow bg-green-600 text-white font-black py-4 rounded-xl shadow-xl text-xl transition-all active:scale-95 disabled:bg-gray-400" disabled={!formData.termsAccepted || !formData.signature}>حفظ العقد</button>
          {isEditing && (
            <>
              <button type="button" onClick={() => window.print()} className="px-8 bg-blue-600 text-white rounded-xl font-black shadow-lg">طباعة</button>
              <button type="button" onClick={handleWhatsAppShare} className="px-8 bg-green-500 text-white rounded-xl font-black shadow-lg">واتساب</button>
            </>
          )}
          <button type="button" onClick={onBack} className="px-8 border-2 border-gray-300 rounded-xl text-gray-600 font-bold">إغلاق</button>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50"><button onClick={() => setShowTerms(false)} className="text-2xl hover:text-red-500">✕</button><h3 className="font-black text-xl text-blue-900">الشروط والأحكام</h3></div>
            <div className="p-8 overflow-y-auto whitespace-pre-line text-right text-lg">{TERMS_AND_CONDITIONS}</div>
            <div className="p-6 bg-gray-50 border-t flex justify-center"><button onClick={() => { setFormData({...formData, termsAccepted: true}); setShowTerms(false); }} className="bg-blue-600 text-white px-12 py-3 rounded-full font-black text-lg">قرأت وموافق</button></div>
          </div>
        </div>
      )}
    </form>
  );
};

export default RepairAgreementForm;
