import os
import re

def apply_fixes():
    print("Starting local file fixes (v8 - Summary Section & Scan Logic)...")
    
    # 1. Update RepairAgreementForm.tsx
    raf_path = os.path.join('src', 'features', 'agreements', 'RepairAgreementForm.tsx')
    if os.path.exists(raf_path):
        with open(raf_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix 1: Improve handleVINScan logic for plate letters spacing and ID conversion
        # We need to ensure result.plateLetters is formatted with spaces and result.idNumber is converted
        scan_logic_old = """              plateNumbers: result.plateNumbers ? arabicToEnglish(result.plateNumbers) : prev.vehicle.plateNumbers,
              plateLetters: result.plateLetters || prev.vehicle.plateLetters
            },
            customer: {
              ...prev.customer,
              fullName: result.customerName || prev.customer.fullName,
              idNumber: result.idNumber ? arabicToEnglish(result.idNumber) : prev.customer.idNumber
            }"""
            
        scan_logic_new = """              plateNumbers: result.plateNumbers ? arabicToEnglish(result.plateNumbers) : prev.vehicle.plateNumbers,
              plateLetters: result.plateLetters ? result.plateLetters.replace(/\\s/g, '').split('').join(' ').trim() : prev.vehicle.plateLetters
            },
            customer: {
              ...prev.customer,
              fullName: result.customerName || prev.customer.fullName,
              idNumber: result.idNumber ? arabicToEnglish(result.idNumber) : prev.customer.idNumber
            }"""
        
        if scan_logic_old in content:
            content = content.replace(scan_logic_old, scan_logic_new)
            print("✅ Fixed plate spacing and ID conversion in scanning logic.")

        # Fix 2: Restore Summary Section before Terms and Conditions
        summary_section = """
        {/* Summary Section */}
        <section className="bg-blue-50 p-6 rounded-xl shadow-sm space-y-4 border border-blue-100 print:bg-white print:border-gray-300 print:p-4">
          <h2 className="text-lg font-bold border-b border-blue-200 pb-2 text-blue-900 print:text-xs print:pb-1">ملخص الإتفاقية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between border-b border-blue-100 pb-1">
                <span className="text-gray-500">اسم العميل:</span>
                <span className="font-bold text-blue-900">{formData.customer.fullName || '---'}</span>
              </div>
              <div className="flex justify-between border-b border-blue-100 pb-1">
                <span className="text-gray-500">نوع المركبة:</span>
                <span className="font-bold text-blue-900">{formData.vehicle.type} {formData.vehicle.model}</span>
              </div>
              <div className="flex justify-between border-b border-blue-100 pb-1">
                <span className="text-gray-500">رقم اللوحة:</span>
                <span className="font-bold text-blue-900" dir="ltr">{formData.vehicle.plateLetters} | {formData.vehicle.plateNumbers}</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-200 flex flex-col justify-center items-center space-y-1">
              <span className="text-gray-500 text-xs uppercase tracking-wider">إجمالي المبلغ المستحق</span>
              <div className="text-3xl font-black text-green-600">
                {total.toFixed(2)} <span className="text-sm font-bold text-gray-400">{RIYAL_SYMBOL}</span>
              </div>
              {formData.discountPercent > 0 && (
                <span className="text-[10px] text-orange-500 font-bold">شامل خصم {formData.discountPercent}%</span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-blue-400 italic text-center">بمجرد التوقيع أدناه، فإنك تقر بصحة البيانات أعلاه والموافقة على الشروط</p>
        </section>
"""
        # Find where to insert (before the "التوقيع والموافقة" section)
        marker = '<section className="bg-white p-6 rounded-xl shadow-sm space-y-4 border print:border-none print:p-0 print:shadow-none">\n          <h2 className="text-lg font-bold border-b pb-2 text-blue-900 print:text-xs print:pb-0 print:mb-0">التوقيع والموافقة</h2>'
        
        if 'ملخص الإتفاقية' not in content and marker in content:
            content = content.replace(marker, summary_section + '\n        ' + marker)
            print("✅ Restored Summary Section.")

        with open(raf_path, 'w', encoding='utf-8') as f:
            f.write(content)

    print("\nAll updates applied! Now run:")
    print("1. git add .")
    print("2. git commit -m 'feat: restore summary section and improve scanning logic'")
    print("3. git push origin main")

if __name__ == "__main__":
    apply_fixes()
