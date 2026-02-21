import os
import re

def apply_fixes():
    print("Starting local file fixes (v14 - PDF Print Layout Fix)...")
    
    # 1. Update ControlPanel.tsx (Fix Print CSS and PDF Export)
    cp_path = os.path.join('src', 'components', 'layout', 'ControlPanel.tsx')
    if os.path.exists(cp_path):
        with open(cp_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Add a Print-Only Section to the top of the return
        # This section will only show when printing and will contain the selected agreements
        print_style = """
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; border-bottom: 1px dashed #ccc; padding-bottom: 20px; margin-bottom: 20px; }
        }
      `}} />
      
      <div className="print-section hidden print:block">
        <h1 className="text-2xl font-bold text-center mb-6 border-b pb-4">تقرير إتفاقيات الإصلاح - مركز تقني المحركات</h1>
        {agreements.filter(a => selectedIds.includes(a.id)).map((agreement, idx) => (
          <div key={agreement.id} className="page-break p-4 space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="font-bold text-lg">رقم العقد: {agreement.serialNumber}</span>
              <span className="text-blue-600 font-bold">{agreement.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>العميل:</strong> {agreement.customer.fullName}</div>
              <div><strong>الجوال:</strong> {agreement.customer.phone}</div>
              <div><strong>السيارة:</strong> {agreement.vehicle.type} {agreement.vehicle.model}</div>
              <div><strong>اللوحة:</strong> {agreement.vehicle.plateLetters} | {agreement.vehicle.plateNumbers}</div>
              <div><strong>تاريخ الإنشاء:</strong> {new Date(agreement.createdAt).toLocaleDateString('en-GB')}</div>
              <div><strong>رقم البطاقة:</strong> {agreement.jobCardNumber || '---'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded border">
              <h4 className="text-xs font-bold mb-1">الشكاوى والملاحظات:</h4>
              <ul className="text-xs space-y-1">
                {agreement.claims.map((c, i) => (
                  <li key={i}>• {c.description}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-xl font-bold text-green-600">
                إجمالي المبلغ: {((agreement.claims.reduce((acc, c) => acc + c.cost, 0)) * (1 - agreement.discountPercent / 100)).toFixed(2)} ر.س
              </span>
            </div>
          </div>
        ))}
      </div>
"""
        
        # Insert the print style and section right after the first <div> in return
        if '<div className="print-section' not in content:
            content = content.replace('return (', 'return (\n    <>')
            content = content.replace('<div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pb-24 no-print">', 
                                     print_style + '<div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pb-24 no-print">')
            content = content.replace('    </div>\n    </div>\n  );', '    </div>\n    </div>\n    </>\n  );')

        with open(cp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Optimized PDF Print Layout for A4 in ControlPanel.tsx")

    # 2. Update RepairAgreementForm.tsx (Ensure print styles are solid there too)
    raf_path = os.path.join('src', 'features', 'agreements', 'RepairAgreementForm.tsx')
    if os.path.exists(raf_path):
        with open(raf_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Ensure the page break and A4 sizing is consistent
        if '@page { size: A4; margin: 10mm; }' not in content:
            content = content.replace('@media print {', '@media print {\n          @page { size: A4; margin: 10mm; }')
        
        with open(raf_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Verified print styles in RepairAgreementForm.tsx")

    print("\n--- DONE ---")
    print("PDF Print layout fixed! Now run:")
    print("1. git add .")
    print("2. git commit -m 'fix: optimize PDF print layout for A4 size'")
    print("3. git push origin main")

if __name__ == "__main__":
    apply_fixes()
