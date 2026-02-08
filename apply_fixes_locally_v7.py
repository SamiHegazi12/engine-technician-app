import os

def apply_fixes():
    print("Starting local file fixes (v7 - Enhanced Claims Display)...")
    
    # 1. Update App.tsx (Preserving previous fixes)
    app_path = os.path.join('src', 'app', 'App.tsx')
    if os.path.exists(app_path):
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Robust serial number logic
        if "reduce((max, a)" not in content:
            old_logic = "const yearlyCount = agreements.filter(a => a.serialNumber && a.serialNumber.startsWith(currentYear.toString())).length;"
            new_logic = """  const yearlyCount = agreements
    .filter(a => a.serialNumber && a.serialNumber.startsWith(currentYear.toString()))
    .reduce((max, a) => {
      const num = parseInt(a.serialNumber.substring(4));
      return isNaN(num) ? max : (num > max ? num : max);
    }, 0);"""
            content = content.replace(old_logic, new_logic)

        # Delivery date mapping
        content = content.replace("expected_delivery_date: data.expected_delivery_date,", "expected_delivery_date: data.expectedDeliveryDate,")

        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Verified App.tsx fixes.")

    # 2. Update RepairAgreementForm.tsx (Preserving previous fixes)
    raf_path = os.path.join('src', 'features', 'agreements', 'RepairAgreementForm.tsx')
    if os.path.exists(raf_path):
        with open(raf_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Serial number preservation on edit
        content = content.replace("serialNumber: generateSerial(),", "serialNumber: initialData ? initialData.serialNumber : generateSerial(),")
        
        # Signature Pad Visibility Logic
        if '<SignaturePad' in content and '{(formData.termsAccepted || isEditing)' not in content:
            new_sig_section = """            {(formData.termsAccepted || isEditing) && (
              <div className="border rounded-lg p-4 bg-gray-50 print:bg-white print:border-gray-300 print:p-2">
                <label className="block text-sm font-bold mb-2 text-gray-700 print:text-[8px] print:mb-1">توقيع العميل (موافق على الشروط)</label>
                <div className="bg-white border rounded-lg overflow-hidden print:border-gray-400">
                  <SignaturePad
                    value={formData.signature || ''}
                    onChange={sig => setFormData({...formData, signature: sig})}
                    disabled={isEditing}
                  />
                </div>
              </div>
            )}"""
            start_search = content.find('توقيع العميل')
            if start_search != -1:
                div_start = content.rfind('<div', 0, start_search)
                sig_end = content.find('/>', start_search)
                div_end = content.find('</div>', sig_end)
                div_end = content.find('</div>', div_end + 1)
                content = content[:div_start] + new_sig_section + content[div_end+6:]

        # Bottom Back Button
        old_bottom = '<div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex gap-4 no-print z-40">'
        if old_bottom in content:
            new_bottom = """<div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex gap-2 no-print z-40">
        <button type="button" onClick={onBack} className="bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-xl border hover:bg-gray-200 transition-all flex items-center gap-2">
          <span>→</span> عودة
        </button>"""
            content = content.replace(old_bottom, new_bottom)

        with open(raf_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Verified RepairAgreementForm.tsx fixes.")

    # 3. Update ControlPanel.tsx (ENHANCED CLAIMS DISPLAY)
    cp_path = os.path.join('src', 'components', 'layout', 'ControlPanel.tsx')
    if os.path.exists(cp_path):
        with open(cp_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # We will replace the whole card content to ensure the layout is perfect
        # Specifically, we want to insert the claims between the vehicle grid and the total price
        
        claims_display = """
              {/* Claims Display */}
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 space-y-2">
                <span className="text-[10px] font-bold text-blue-600 block uppercase tracking-wider">الشكاوى والملاحظات</span>
                <div className="space-y-1.5">
                  {agreement.claims && agreement.claims.length > 0 ? (
                    agreement.claims.map((claim, idx) => (
                      <div key={claim.id || idx} className="text-[11px] text-gray-700 flex items-start gap-2 leading-relaxed">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{claim.description || 'بدون وصف'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-gray-400 italic">لا توجد شكاوى مسجلة</div>
                  )}
                </div>
              </div>
"""
        
        # Targeted replacement: Find the vehicle grid and insert after it
        marker = '</div>\n              <div className="flex justify-between items-center pt-2">'
        
        # Clean up any previous partial attempts first
        if 'الشكاوى والملاحظات' in content:
            import re
            content = re.sub(r'\{/\* Claims Display \*/\}.*?\{/\* End Claims \*/\}', '', content, flags=re.DOTALL)
            # If the simple string replacement was used before
            content = re.sub(r'<div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">.*?</div>\s+</div>', '</div>', content, flags=re.DOTALL)

        if marker in content:
            content = content.replace(marker, '</div>' + '{/* Claims Display */}' + claims_display + '{/* End Claims */}' + '\n              <div className="flex justify-between items-center pt-2">')
            print("✅ Added Enhanced Claims Display to Control Panel.")
        else:
            print("❌ Could not find the correct spot in ControlPanel.tsx. Please check the file structure.")

        # Ensure signature display is also there (preserving previous fix)
        if 'agreement.signature' not in content:
            sig_display = """
              {agreement.signature && (
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <p className="text-[10px] text-gray-400 mb-1 text-right">توقيع العميل (موافق على الشروط)</p>
                  <div className="bg-white rounded border h-16 flex items-center justify-center overflow-hidden">
                    <img src={agreement.signature} alt="Customer Signature" className="max-h-full object-contain" />
                  </div>
                </div>
              )}
"""
            # Insert before the action buttons
            content = content.replace('\n              <div className="flex justify-between items-center pt-2">', sig_display + '\n              <div className="flex justify-between items-center pt-2">')
            print("✅ Verified signature display in Control Panel.")

        with open(cp_path, 'w', encoding='utf-8') as f:
            f.write(content)

    # 4. Update SignaturePad.tsx
    sp_path = os.path.join('src', 'components', 'ui', 'SignaturePad.tsx')
    if os.path.exists(sp_path):
        if 'value?: string' not in open(sp_path).read():
            new_sp_content = """import React, { useRef, useEffect, useState } from 'react';

interface SignaturePadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ value, onChange, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (value) {
      const img = new Image();
      img.src = value;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
    }
  }, [value]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    if (e.cancelable) e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      onChange('');
    }
  };

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className={`signature-pad w-full h-[220px] border border-gray-300 rounded-lg bg-white touch-none shadow-inner ${disabled ? 'cursor-default' : 'cursor-crosshair'}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      {!disabled && (
        <button
          type="button"
          onClick={clear}
          className="absolute top-3 left-3 text-sm font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-100 border border-red-200 transition-colors"
        >
          مسح التوقيع
        </button>
      )}
    </div>
  );
};

export default SignaturePad;
"""
            with open(sp_path, 'w', encoding='utf-8') as f:
                f.write(new_sp_content)
            print("✅ Verified SignaturePad interface.")

    print("\nAll updates applied! Now run:")
    print("1. git add .")
    print("2. git commit -m 'feat: enhanced claims display in control panel'")
    print("3. git push origin main")

if __name__ == "__main__":
    apply_fixes()
