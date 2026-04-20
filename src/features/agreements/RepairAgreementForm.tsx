import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RepairAgreement, Claim, RepairStatus } from '@/types';
import { COLORS, RIYAL_SYMBOL, TERMS_AND_CONDITIONS, CAR_MANUFACTURERS } from '@/config/constants';
import { extractVehicleInfoFromImage } from '@/lib/gemini';
import SignaturePad from '@/components/ui/SignaturePad';

interface Props {
  initialData?: RepairAgreement;
  onSave: (data: RepairAgreement) => void;
  onBack: () => void;
  agreementsCount?: number;
}

const RepairAgreementForm: React.FC<Props> = ({ initialData, onSave, onBack, agreementsCount = 0 }) => {
  const isEditing = !!initialData;
  const currentYear = new Date().getFullYear().toString();

  const generateSerial = useCallback(() => {
    const count = (agreementsCount + 1).toString().padStart(4, '0');
    return `${currentYear}${count}`;
  }, [agreementsCount, currentYear]);

  const [formData, setFormData] = useState<RepairAgreement>(() => {
    if (initialData) {
      return {
        ...initialData,
        expectedDeliveryDate: initialData.expectedDeliveryDate || '',
        signature: initialData.signature || '',
        vehicle: {
          ...initialData.vehicle,
          odometer: initialData.vehicle.odometer || 0,
          vin: initialData.vehicle.vin || ''
        }
      };
    }
    return {
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
      termsAccepted: false,
      repairAgreementLink: ''
    };
  });

  const [showTerms, setShowTerms] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [carSearch, setCarSearch] = useState('');
  const [showCarList, setShowCarList] = useState(false);

  const arabicToEnglish = useCallback((str: string) => {
    if (!str) return '';
    const map: { [key: string]: string } = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    return str.toString().replace(/[٠-٩]/g, d => map[d]);
  }, []);

  const compressImage = useCallback((base64: string, maxWidth = 1024, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = (e) => reject(e);
    });
  }, []);

  const handleVINScan = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resultStr = reader.result as string;
        const compressedBase64 = await compressImage(resultStr, 1200, 0.85);
        const result = await extractVehicleInfoFromImage(compressedBase64);
        if (result && Object.values(result).some(v => v !== null)) {
          setFormData((prev: RepairAgreement) => ({
            ...prev,
            vehicle: {
              ...prev.vehicle,
              vin: result.vin?.toUpperCase() || prev.vehicle.vin,
              type: result.brand || prev.vehicle.type,
              model: result.model?.toUpperCase() || prev.vehicle.model,
              year: result.year ? arabicToEnglish(result.year) : prev.vehicle.year,
              color: result.color || prev.vehicle.color,
              plateNumbers: result.plateNumbers ? arabicToEnglish(result.plateNumbers) : prev.vehicle.plateNumbers,
              plateLetters: result.plateLetters ? result.plateLetters.replace(/\s/g, '').split('').join(' ').trim() : prev.vehicle.plateLetters
            },
            customer: {
              ...prev.customer,
              fullName: result.customerName || prev.customer.fullName,
              idNumber: result.idNumber ? arabicToEnglish(result.idNumber) : prev.customer.idNumber
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
  }, [compressImage, arabicToEnglish]);

  const handlePlateLettersChange = useCallback((val: string) => {
    const cleaned = val.replace(/[^\u0600-\u06FF]/g, '').slice(0, 3);
    const formatted = cleaned.split('').join(' ').trim();
    setFormData((prev: RepairAgreement) => ({ ...prev, vehicle: { ...prev.vehicle, plateLetters: formatted } }));
  }, []);

  const addClaim = useCallback(() => { 
    setFormData((prev: RepairAgreement) => ({ ...prev, claims: [...prev.claims, { id: crypto.randomUUID(), description: '', cost: 0 }] })); 
  }, []);

  const removeClaim = useCallback((id: string) => { 
    setFormData((prev: RepairAgreement) => ({ ...prev, claims: prev.claims.filter((c: Claim) => c.id !== id) })); 
  }, []);

  const updateClaim = useCallback((idx: number, field: keyof Claim, value: any) => {
    const newClaims = [...formData.claims];
    newClaims[idx] = { ...newClaims[idx], [field]: value };
    setFormData((prev: RepairAgreement) => ({ ...prev, claims: newClaims }));
  }, [formData.claims]);

  const subtotal = useMemo(() => formData.claims.reduce((acc: number, c: Claim) => acc + c.cost, 0), [formData.claims]);
  const total = useMemo(() => subtotal * (1 - formData.discountPercent / 100), [subtotal, formData.discountPercent]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.signature) { 
      alert("يرجى التوقيع للمتابعة"); 
      return; 
    }
    onSave(formData);
  }, [formData, onSave]);

  const handleWhatsAppShare = useCallback(() => {
    let phone = formData.customer.phone;
    if (phone.startsWith('05')) phone = '966' + phone.substring(1);
    let message = `مرحباً ${formData.customer.fullName}، إليك تفاصيل إتفاقية إصلاح الخاصة بك رقم ${formData.serialNumber}. الإجمالي: ${total.toFixed(2)} ${RIYAL_SYMBOL}`;
    if (formData.repairAgreementLink) {
      message += `\nرابط الإتفاقية: ${formData.repairAgreementLink}`;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }, [formData.customer.phone, formData.customer.fullName, formData.serialNumber, formData.repairAgreementLink, total]);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = async () => {
        const compressed = await compressImage(reader.result as string, 1600, 0.9);
        setFormData((prev: RepairAgreement) => ({ ...prev, photos: [...prev.photos, `data:image/jpeg;base64,${compressed}`] }));
      };
      reader.readAsDataURL(file);
    });
  }, [compressImage]);

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-6 pb-32 print:p-0 print:space-y-1 print:pb-0 text-right" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          section { page-break-inside: avoid; margin-bottom: 5px !important; }
        }
      `}} />

      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm no-print">
        <button type="button" onClick={onBack} className="text-gray-600 flex items-center gap-2 font-bold"><span>→</span> عودة</button>
        <h1 className="text-xl font-bold text-blue-900">إتفاقية إصلاح</h1>
        <div className="text-sm font-medium text-gray-500 font-mono">رقم العقد: {formData.serialNumber}</div>
      </div>

      <div className="grid grid-cols-1 gap-6 print:gap-1">
        <section className="bg-white p-6 rounded-xl shadow-sm space-y-4 border print:border-none print:p-0 print:shadow-none">
          <h2 className="text-lg font-bold border-b pb-2 mb-2 text-blue-900 print:text-xs print:mb-0 print:pb-0">بيانات إتفاقية الإصلاح</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">تاريخ الإنشاء</label>
              <input type="text" value={new Date(formData.createdAt).toLocaleString('en-GB')} disabled className="w-full bg-gray-50 border rounded p-2 text-right text-gray-500 print:bg-white print:border-none print:p-0 print:text-[10px]" />
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">تاريخ التسليم*</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.expectedDeliveryDate}
                onChange={e => {
                  const date = new Date(e.target.value);
                  if (date.getDay() === 5) {
                    alert("عذراً، يوم الجمعة إجازة. يرجى اختيار تاريخ آخر.");
                    setFormData({...formData, expectedDeliveryDate: ''});
                  } else {
                    setFormData({...formData, expectedDeliveryDate: e.target.value});
                  }
                }}
                className="w-full border rounded p-2 text-right print:border-none print:p-0 print:text-[10px]"
              />
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">رقم بطاقة العمل</label>
              <input type="text" value={formData.jobCardNumber} onChange={e => setFormData({...formData, jobCardNumber: e.target.value})} className="w-full border rounded p-2 text-right print:border-none print:p-0 print:text-[10px]" placeholder="أدخل الرقم" />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm space-y-4 border print:border-none print:p-0 print:shadow-none">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-2 print:pb-0 gap-2">
            <h2 className="text-lg font-bold text-blue-900 print:text-xs">بيانات المركبة</h2>
            <div className="flex gap-2 no-print">
              <label className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all shadow-md ${isScanning ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
                {isScanning ? '...' : '📷 كاميرا'}
                <input type="file" accept="image/*" capture="environment" onChange={handleVINScan} className="hidden" disabled={isScanning} />
              </label>
              <label className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all shadow-md ${isScanning ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white`}>
                {isScanning ? '...' : '📁 رفع صورة'}
                <input type="file" accept="image/*" onChange={handleVINScan} className="hidden" disabled={isScanning} />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
            <div className="text-right relative">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">نوع السيارة*</label>
              <div className="no-print">
                <div
                  onClick={() => setShowCarList(!showCarList)}
                  className="w-full border rounded p-2 text-right font-bold cursor-pointer bg-white flex justify-between items-center"
                >
                  <span className="text-gray-400 text-xs">▼</span>
                  <span>{formData.vehicle.type || 'اختر النوع'}</span>
                </div>

                {showCarList && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-xl overflow-hidden flex flex-col max-h-64">
                    <input
                      type="text"
                      placeholder="بحث عن شركة..."
                      className="p-2 border-b text-right outline-none focus:bg-blue-50"
                      value={carSearch}
                      onChange={(e) => setCarSearch(e.target.value)}
                      autoFocus
                    />
                    <div className="overflow-y-auto">
                      {['أخرى', ...CAR_MANUFACTURERS]
                        .filter(m => m.includes(carSearch))
                        .map(m => (
                          <div
                            key={m}
                            className="p-2 hover:bg-blue-600 hover:text-white cursor-pointer text-right border-b last:border-none"
                            onClick={() => {
                              setFormData((prev: RepairAgreement) => ({...prev, vehicle: {...prev.vehicle, type: m}}));
                              setShowCarList(false);
                              setCarSearch('');
                            }}
                          >
                            {m}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden print:block border rounded p-2 text-right font-bold text-[10px]">
                {formData.vehicle.type}
              </div>

              {formData.vehicle.type === 'أخرى' && (
                <input
                  type="text"
                  placeholder="أدخل نوع السيارة يدوياً"
                  className="w-full border rounded p-2 mt-2 text-right font-bold no-print"
                  value={formData.vehicle.type === 'أخرى' ? '' : formData.vehicle.type}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: RepairAgreement) => ({...prev, vehicle: {...prev.vehicle, type: e.target.value}}))}
                />
              )}
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">الموديل*</label>
              <input type="text" required value={formData.vehicle.model} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: RepairAgreement) => ({...prev, vehicle: {...prev.vehicle, model: e.target.value}}))} className="w-full border rounded p-2 text-right font-bold print:border-none print:p-0 print:text-[10px]" />
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[8px]">سنة الصنع*</label>
              <input type="text" required maxLength={4} value={formData.vehicle.year} onChange={(e: React.ChangeEvent<HTMLInputEl
(Content truncated due to size limit. Use line ranges to read remaining content)