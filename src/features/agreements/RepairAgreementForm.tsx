import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RepairAgreement, Claim, RepairStatus } from '@/types';
import { COLORS, RIYAL_SYMBOL, TERMS_AND_CONDITIONS, CAR_MANUFACTURERS } from '@/config/constants';
import { extractVehicleInfoFromImage } from '@/lib/gemini';
import SignaturePad from 'signature_pad';

interface Props {
  initialData?: RepairAgreement;
  onSave: (data: RepairAgreement) => void;
  onBack: () => void;
  agreementsCount?: number;
}

const RepairAgreementForm: React.FC<Props> = ({ initialData, onSave, onBack, agreementsCount = 0 }) => {
  const isEditing = !!initialData;
  const currentYear = new Date().getFullYear().toString();
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
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
      termsAccepted: false
    };
  });

  const [showTerms, setShowTerms] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [carSearch, setCarSearch] = useState('');
  const [showCarList, setShowCarList] = useState(false);

  // Initialize Signature Pad
  useEffect(() => {
    if (canvasRef.current && (formData.termsAccepted || isEditing)) {
      const canvas = canvasRef.current;
      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)'
      });

      if (formData.signature) {
        signaturePadRef.current.fromDataURL(formData.signature);
      }

      signaturePadRef.current.on = () => {
        const dataUrl = signaturePadRef.current?.toDataURL();
        if (dataUrl) {
          setFormData(prev => ({ ...prev, signature: dataUrl }));
        }
      };
    }

    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
        signaturePadRef.current = null;
      }
    };
  }, [formData.termsAccepted, isEditing]);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setFormData(prev => ({ ...prev, signature: '' }));
    }
  };

  useEffect(() => {
    if (isEditing && formData.serialNumber.includes('-')) {
      setFormData(prev => ({
        ...prev,
        serialNumber: prev.serialNumber.replace('-', '')
      }));
    }
  }, [isEditing, formData.serialNumber]);

  const convertArabicToEnglish = useCallback((str: string) => {
    if (!str) return '';
    return str.toString().replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => {
      return (d.charCodeAt(0) - 1632).toString();
    });
  }, []);

  const compressImage = useCallback((base64: string, maxWidth = 800, quality = 0.6): Promise<string> => {
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

  const handleVINScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resultStr = reader.result as string;
        const compressedBase64 = await compressImage(resultStr, 1000, 0.7);
        const result = await extractVehicleInfoFromImage(compressedBase64);
        if (result && (result.vin || result.brand || result.customerName)) {
          setFormData(prev => ({
            ...prev,
            vehicle: { 
              ...prev.vehicle, 
              vin: result.vin?.toUpperCase() || prev.vehicle.vin, 
              type: result.brand || prev.vehicle.type, 
              model: result.model?.toUpperCase() || prev.vehicle.model, 
              year: result.year ? convertArabicToEnglish(result.year.toString()) : prev.vehicle.year, 
              color: result.color || prev.vehicle.color,
              plateNumbers: result.plateNumbers ? convertArabicToEnglish(result.plateNumbers.toString()) : prev.vehicle.plateNumbers,
              plateLetters: result.plateLetters || prev.vehicle.plateLetters
            },
            customer: {
              ...prev.customer,
              fullName: result.customerName || prev.customer.fullName,
              idNumber: result.idNumber ? convertArabicToEnglish(result.idNumber.toString()) : prev.customer.idNumber
            }
          }));
        } else {
          alert("تنبيه: لم يتمكن الذكاء الاصطناعي من استخراج كافة البيانات. يرجى مراجعة الحقول وتعبئتها يدوياً.");
        }
      } catch (err) {
        console.error("Scan processing error:", err);
        alert("حدث خطأ أثناء معالجة الصورة. يرجى التأكد من أن الصورة واضحة وتحتوي على بيانات المركبة.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePlateLettersChange = (val: string) => {
    const cleaned = val.replace(/[^\u0600-\u06FF]/g, '').slice(0, 3);
    const formatted = cleaned.split('').join(' ').trim();
    setFormData(prev => ({ ...prev, vehicle: { ...prev.vehicle, plateLetters: formatted } }));
  };

  const addClaim = () => { setFormData(prev => ({ ...prev, claims: [...prev.claims, { id: crypto.randomUUID(), description: '', cost: 0 }] })); };
  const removeClaim = (id: string) => { setFormData(prev => ({ ...prev, claims: prev.claims.filter(c => c.id !== id) })); };
  const updateClaim = (idx: number, field: keyof Claim, value: any) => {
    setFormData(prev => {
      const newClaims = [...prev.claims];
      newClaims[idx] = { ...newClaims[idx], [field]: value };
      return { ...prev, claims: newClaims };
    });
  };

  const subtotal = useMemo(() => formData.claims.reduce((acc, c) => acc + c.cost, 0), [formData.claims]);
  const total = useMemo(() => subtotal * (1 - formData.discountPercent / 100), [subtotal, formData.discountPercent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.signature) { alert("يرجى التوقيع للمتابعة"); return; }
    onSave(formData);
  };

  const handleWhatsAppShare = () => {
    let phone = formData.customer.phone;
    if (phone.startsWith('05')) phone = '966' + phone.substring(1);
    const currentUrl = window.location.origin;
    const agreementLink = `${currentUrl}/?agreement=${formData.id}`;
    const message = `مرحباً ${formData.customer.fullName}، إليك تفاصيل إتفاقية الإصلاح الخاصة بك رقم ${formData.serialNumber}.\n\nالإجمالي: ${total.toFixed(2)} ر.س\nرابط الإتفاقية: ${agreementLink}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = async () => {
        const compressed = await compressImage(reader.result as string, 600, 0.5);
        setFormData(prev => ({ ...prev, photos: [...prev.photos, `data:image/jpeg;base64,${compressed}`] }));
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-6 pb-32 print:p-0 print:space-y-2 print:pb-0 text-right" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          form { width: 100%; max-width: 100%; margin: 0; padding: 0; }
          section { border: 1px solid #eee !important; margin-bottom: 8px !important; padding: 10px !important; border-radius: 8px !important; page-break-inside: avoid; }
          .photo-grid { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 5px !important; }
          .photo-item { height: 100px !important; width: 100% !important; object-fit: cover !important; border-radius: 4px !important; }
        }
      `}} />

      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm no-print">
        <button type="button" onClick={onBack} className="text-gray-600 flex items-center gap-2 font-bold"><span>→</span> عودة</button>
        <h1 className="text-xl font-bold text-blue-900">إتفاقية إصلاح</h1>
        <div className="text-sm font-medium text-gray-500 font-mono">رقم الإتفاقية: {formData.serialNumber}</div>
      </div>

      <div className="hidden print:flex justify-between items-center mb-4 border-b-2 border-blue-900 pb-2">
        <div>
          <h1 className="text-2xl font-black text-blue-900">إتفاقية إصلاح مركبة</h1>
          <p className="text-sm text-gray-500">مركز تقني المحركات لصيانة السيارات</p>
        </div>
        <div className="text-left">
          <p className="text-lg font-black text-blue-900">#{formData.serialNumber}</p>
          <p className="text-xs text-gray-500">{new Date(formData.createdAt).toLocaleString('en-GB')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 print:gap-2">
        <section className="bg-white p-6 rounded-xl shadow-sm space-y-4 border print:border-gray-100 print:p-3 print:shadow-none">
          <h2 className="text-lg font-bold border-b pb-2 mb-2 text-blue-900 print:text-sm print:mb-1 print:pb-1">بيانات إتفاقية الإصلاح</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-4">
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[10px]">تاريخ الإنشاء</label>
              <div className="w-full bg-gray-50 border rounded p-2 text-right text-gray-500 print:bg-white print:border-none print:p-0 print:text-[11px]">{new Date(formData.createdAt).toLocaleString('en-GB')}</div>
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[10px]">تاريخ التسليم المتوقع*</label>
              <input 
                type="date" 
                required 
                min={new Date().toISOString().split('T')[0]} 
                value={formData.expectedDeliveryDate} 
                onChange={(e) => setFormData(prev => ({...prev, expectedDeliveryDate: e.target.value}))} 
                className="w-full border rounded p-2 text-right print:border-none print:p-0 print:text-[11px]" 
              />
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[10px]">رقم بطاقة العمل</label>
              <input 
                type="text" 
                value={formData.jobCardNumber} 
                onChange={(e) => setFormData(prev => ({...prev, jobCardNumber: e.target.value}))} 
                className="w-full border rounded p-2 text-right print:border-none print:p-0 print:text-[11px]" 
              />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm space-y-4 border print:border-gray-100 print:p-3 print:shadow-none">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-2 print:pb-1 gap-2">
            <h2 className="text-lg font-bold text-blue-900 print:text-sm">بيانات المركبة</h2>
            <div className="flex gap-2 no-print">
              <label className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all shadow-md ${isScanning ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
                {isScanning ? 'جاري المسح...' : '📷 كاميرا'}
                <input type="file" accept="image/*" capture="environment" onChange={handleVINScan} className="hidden" disabled={isScanning} />
              </label>
              <label className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all shadow-md ${isScanning ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white`}>
                {isScanning ? '...' : '📁 رفع صورة'}
                <input type="file" accept="image/*" onChange={handleVINScan} className="hidden" disabled={isScanning} />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-4">
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[10px]">رقم الشاصي (VIN)*</label>
              <input 
                type="text" 
                required 
                maxLength={17} 
                value={formData.vehicle.vin} 
                onChange={(e) => setFormData(prev => ({...prev, vehicle: {...prev.vehicle, vin: e.target.value.toUpperCase()}}))} 
                className="w-full border rounded p-2 text-left font-mono font-bold print:border-none print:p-0 print:text-[11px]" 
              />
            </div>
            <div className="text-right relative">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[10px]">نوع السيارة*</label>
              <div className="no-print">
                <div onClick={() => setShowCarList(!showCarList)} className="w-full border rounded p-2 text-right font-bold cursor-pointer bg-white flex justify-between items-center">
                  <span className="text-gray-400 text-xs">▼</span>
                  <span>{formData.vehicle.type || 'اختر النوع'}</span>
                </div>
                {showCarList && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-xl overflow-hidden flex flex-col max-h-64">
                    <input type="text" className="p-3 border-b outline-none sticky top-0 bg-white" placeholder="ابحث عن الماركة..." autoFocus value={carSearch} onChange={e => setCarSearch(e.target.value)} />
                    <div className="overflow-y-auto">
                      {CAR_MANUFACTURERS.filter(m => m.toLowerCase().includes(carSearch.toLowerCase())).map(m => (
                        <div key={m} className="p-3 hover:bg-blue-50 cursor-pointer text-right border-b last:border-0" onClick={() => { setFormData(prev => ({...prev, vehicle: {...prev.vehicle, type: m}})); setShowCarList(false); setCarSearch(''); }}>{m}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden print:block text-[11px] font-bold p-1">{formData.vehicle.type}</div>
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[10px]">الموديل*</label>
              <input 
                type="text" 
                required 
                value={formData.vehicle.model} 
                onChange={(e) => setFormData(prev => ({...prev, vehicle: {...prev.vehicle, model: e.target.value}}))} 
                className="w-full border rounded p-2 text-right print:border-none print:p-0 print:text-[11px]" 
              />
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[10px]">سنة الصنع*</label>
              <input 
                type="text" 
                required 
                value={formData.vehicle.year} 
                onChange={(e) => setFormData(prev => ({...prev, vehicle: {...prev.vehicle, year: convertArabicToEnglish(e.target.value)}}))} 
                className="w-full border rounded p-2 text-right print:border-none print:p-0 print:text-[11px]" 
              />
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[10px]">اللون*</label>
              <select 
                required 
                value={formData.vehicle.color} 
                onChange={(e) => setFormData(prev => ({...prev, vehicle: {...prev.vehicle, color: e.target.value}}))} 
                className="w-full border rounded p-2 text-right print:appearance-none print:border-none print:p-0 print:text-[11px]"
              >
                <option value="">اختر اللون</option>
                {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[10px]">اللوحة*</label>
              <div className="flex gap-1 print:text-[11px]">
                <input 
                  type="text" 
                  required 
                  value={formData.vehicle.plateLetters} 
                  onChange={(e) => handlePlateLettersChange(e.target.value)} 
                  className="w-1/2 border rounded p-2 text-center print:border-none print:p-0" 
                  placeholder="ح ر ف" 
                />
                <input 
                  type="text" 
                  required 
                  value={formData.vehicle.plateNumbers} 
                  onChange={(e) => setFormData(prev => ({...prev, vehicle: {...prev.vehicle, plateNumbers: convertArabicToEnglish(e.target.value.replace(/\D/g, '').slice(0, 4))}}))} 
                  className="w-1/2 border rounded p-2 text-center print:border-none print:p-0" 
                  placeholder="أرقام" 
                />
              </div>
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[10px]">العداد*</label>
              <input 
                type="number" 
                required 
                value={formData.vehicle.odometer === 0 ? '' : formData.vehicle.odometer} 
                onChange={(e) => setFormData(prev => ({...prev, vehicle: {...prev.vehicle, odometer: parseInt(e.target.value) || 0}}))} 
                className="w-full border rounded p-2 text-right print:border-none print:p-0 print:text-[11px]" 
                placeholder="0" 
              />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm space-y-4 border print:border-gray-100 print:p-3 print:shadow-none">
          <h2 className="text-lg font-bold border-b pb-2 mb-2 text-blue-900 print:text-sm print:mb-1 print:pb-1">بيانات العميل</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-4">
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[10px]">اسم العميل*</label>
              <input 
                type="text" 
                required 
                value={formData.customer.fullName} 
                onChange={(e) => setFormData(prev => ({...prev, customer: {...prev.customer, fullName: e.target.value}}))} 
                className="w-full border rounded p-2 text-right font-bold print:border-none print:p-0 print:text-[11px]" 
              />
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[10px]">رقم الجوال*</label>
              <input 
                type="tel" 
                required 
                pattern="05[0-9]{8}" 
                maxLength={10} 
                value={formData.customer.phone} 
                onChange={(e) => setFormData(prev => ({...prev, customer: {...prev.customer, phone: convertArabicToEnglish(e.target.value.replace(/\D/g, ''))}}))} 
                className="w-full border rounded p-2 text-right font-bold print:border-none print:p-0 print:text-[11px]" 
              />
            </div>
            <div className="text-right">
              <label className="block text-sm mb-1 text-gray-600 font-bold print:text-[10px]">رقم الهوية*</label>
              <input 
                type="text" 
                required 
                pattern="[12][0-9]{9}" 
                maxLength={10} 
                value={formData.customer.idNumber} 
                onChange={(e) => setFormData(prev => ({...prev, customer: {...prev.customer, idNumber: convertArabicToEnglish(e.target.value.replace(/\D/g, ''))}}))} 
                className="w-full border rounded p-2 text-right font-bold print:border-none print:p-0 print:text-[11px]" 
              />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm space-y-4 border print:border-gray-100 print:p-3 print:shadow-none">
          <div className="flex justify-between items-center border-b pb-2 print:pb-1"><h2 className="text-lg font-bold text-blue-900 print:text-sm">الطلبات والأعطال</h2><button type="button" onClick={addClaim} className="text-blue-600 text-sm font-bold no-print">+ إضافة طلب</button></div>
          <div className="space-y-2 print:space-y-0">
            <div className="flex gap-2 items-center font-bold text-gray-600 border-b pb-2 no-print">
              <div className="w-10"></div>
              <div className="flex-grow text-right">وصف العطل / الطلب</div>
              <div className="w-24 text-right">التكلفة</div>
            </div>
            {formData.claims.map((claim, idx) => (
              <div key={claim.id} className="flex gap-2 items-center no-print">
                <button type="button" onClick={() => removeClaim(claim.id)} className="text-red-500 font-bold px-2 w-10">✕</button>
                <input type="text" required value={claim.description} onChange={e => updateClaim(idx, 'description', e.target.value)} className="flex-grow border rounded p-2 text-right" placeholder="وصف العطل أو الطلب" />
                <input type="number" required value={claim.cost === 0 ? '' : claim.cost} onChange={e => updateClaim(idx, 'cost', parseFloat(e.target.value) || 0)} className="w-24 border rounded p-2 text-right" placeholder="0.00" />
              </div>
            ))}
          </div>
          <div className="hidden print:block">
            <div className="flex justify-between border-b-2 border-gray-800 py-1 text-[11px] font-bold">
              <span className="flex-grow text-right">وصف العطل / الطلب</span>
              <span className="w-24 text-right">التكلفة</span>
            </div>
            {formData.claims.map((c, i) => (
              <div key={i} className="flex justify-between border-b py-1 text-[11px]">
                <span className="flex-grow text-right">{c.description}</span>
                <span className="w-24 text-right">{c.cost.toFixed(2)} {RIYAL_SYMBOL}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 space-y-2 border-t flex flex-col items-start">
            <div className="flex justify-between text-gray-600 print:text-[11px] w-full max-w-xs">
              <span className="font-bold flex-grow text-right">المجموع الفرعي:</span>
              <span className="font-bold w-24 text-right">{subtotal.toFixed(2)} {RIYAL_SYMBOL}</span>
            </div>
            <div className="flex justify-between items-center no-print w-full max-w-xs">
              <span className="font-bold">الخصم:</span>
              <div className="flex items-center gap-2">
                <input type="number" className="w-20 border rounded p-1 text-right font-bold" value={formData.discountPercent === 0 ? '' : formData.discountPercent} onChange={e => setFormData(prev => ({...prev, discountPercent: parseFloat(e.target.value) || 0}))} />
                <span className="text-gray-500">%</span>
              </div>
            </div>
            <div className="flex justify-between text-xl font-black text-blue-900 pt-1 print:text-sm print:pt-1 w-full max-w-xs">
              <span className="flex-grow text-right">الإجمالي النهائي:</span>
              <span className="w-24 text-right">{total.toFixed(2)} {RIYAL_SYMBOL}</span>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm space-y-4 border print:border-gray-100 print:p-3 print:shadow-none">
          <h2 className="text-lg font-bold border-b pb-2 text-blue-900 print:text-sm print:pb-1">صور حالة الهيكل</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 photo-grid">
            {formData.photos.map((p, idx) => (
              <div key={idx} className="relative aspect-square">
                <img src={p} className="w-full h-full object-cover rounded-lg border shadow-sm photo-item" />
                <button type="button" onClick={() => setFormData(prev => ({...prev, photos: prev.photos.filter((_, i) => i !== idx)}))} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center no-print">✕</button>
              </div>
            ))}
            <label className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 no-print">
              <span className="text-3xl text-gray-400">+</span>
              <span className="text-xs text-gray-500">إضافة صورة</span>
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        </section>

        <section className="bg-blue-50 p-6 rounded-xl border-2 border-blue-100 space-y-4 print:p-3 print:bg-white print:border-gray-100">
          <h2 className="text-lg font-bold border-b border-blue-200 pb-2 text-blue-900 print:text-sm print:pb-1">ملخص الإتفاقية والموافقة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm print:text-[11px] print:gap-2">
            <div className="space-y-1">
              <p><span className="font-bold">اسم العميل:</span> {formData.customer.fullName || '---'}</p>
              <p><span className="font-bold">نوع السيارة:</span> {formData.vehicle.type} {formData.vehicle.model}</p>
            </div>
            <div className="space-y-1">
              <p><span className="font-bold">رقم اللوحة:</span> {formData.vehicle.plateLetters} {formData.vehicle.plateNumbers}</p>
              <p><span className="font-bold">المبلغ المتفق عليه:</span> {total.toFixed(2)} {RIYAL_SYMBOL}</p>
            </div>
          </div>
          
          <div className="pt-4 no-print">
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border shadow-sm">
              <label htmlFor="terms" className="text-gray-700 font-bold cursor-pointer flex-grow text-right">
                أقر بالموافقة على <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 underline font-black">الشروط والأحكام</button>
              </label>
              <input type="checkbox" id="terms" checked={formData.termsAccepted} onChange={e => setFormData(prev => ({...prev, termsAccepted: e.target.checked}))} className="w-8 h-8 accent-blue-600 cursor-pointer order-1" />
            </div>
          </div>

          <div className="hidden print:block pt-2">
            <p className="text-[11px] font-bold">أقر أنا الموقع أدناه بموافقتي على الشروط والأحكام المذكورة أعلاه وعلى إجمالي المبلغ المتفق عليه.</p>
          </div>

          <div className="text-right pt-4">
            <label className="block font-bold mb-4 text-lg print:text-sm print:mb-1">توقيع العميل:</label>
            <div className="print:hidden">
              {(formData.termsAccepted || isEditing) && (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="relative w-full">
                    <canvas 
                      ref={canvasRef}
                      className="signature-pad w-full h-[220px] border border-gray-300 rounded-lg bg-white touch-none shadow-inner cursor-crosshair"
                    />
                    <button 
                      type="button" 
                      onClick={clearSignature}
                      className="absolute top-3 left-3 text-sm font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      مسح التوقيع
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="hidden print:block border-b-2 border-gray-300 h-24 flex items-center justify-center">
              {formData.signature ? <img src={formData.signature} alt="Signature" className="max-h-full max-w-full object-contain" /> : <span className="text-gray-300">لا يوجد توقيع</span>}
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 no-print shadow-2xl z-40">
        <div className="max-w-4xl mx-auto flex flex-row-reverse gap-4">
          <button type="submit" className="flex-grow bg-green-600 text-white font-black py-4 rounded-xl shadow-xl text-xl transition-all active:scale-95 disabled:bg-gray-400" disabled={!formData.termsAccepted || !formData.signature}>حفظ الإتفاقية</button>
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
            <div className="p-6 bg-gray-50 border-t flex justify-center"><button onClick={() => { setFormData(prev => ({...prev, termsAccepted: true})); setShowTerms(false); }} className="bg-blue-600 text-white px-12 py-3 rounded-full font-black text-lg">قرأت وموافق</button></div>
          </div>
        </div>
      )}
    </form>
  );
};

export default RepairAgreementForm;
