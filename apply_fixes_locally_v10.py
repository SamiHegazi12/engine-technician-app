import os
import re

def apply_fixes():
    print("Starting local file fixes (v10 - FORCE UPDATE)...")
    
    # 1. Update index.ts (Add CANCELLED status)
    types_path = os.path.join('src', 'types', 'index.ts')
    if os.path.exists(types_path):
        with open(types_path, 'r', encoding='utf-8') as f:
            content = f.read()
        if "ملغي" not in content:
            # Flexible replacement for the enum
            content = re.sub(r"(DELIVERED\s*=\s*'تم التسليم')", r"\1,\n  CANCELLED = 'ملغي'", content)
            with open(types_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("✅ Status 'ملغي' added to index.ts")

    # 2. Update ControlPanel.tsx (Colors and Layout)
    cp_path = os.path.join('src', 'components', 'layout', 'ControlPanel.tsx')
    if os.path.exists(cp_path):
        with open(cp_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Force Update Status Colors using Regex
        status_func_pattern = r"const getStatusColor = \(status: RepairStatus\) => \{.*?\};"
        new_status_func = """const getStatusColor = (status: RepairStatus) => {
    switch(status) {
      case 'جديد': return 'bg-blue-100 text-blue-700';
      case 'قيد العمل': return 'bg-yellow-100 text-yellow-700';
      case 'في إنتظار القطع': return 'bg-orange-100 text-orange-700';
      case 'مكتمل': return 'bg-pink-100 text-pink-700';
      case 'تم التسليم': return 'bg-green-100 text-green-700';
      case 'ملغي': return 'bg-red-600 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };"""
        content = re.sub(status_func_pattern, new_status_func, content, flags=re.DOTALL)
        print("✅ Status colors updated (Green/Pink/Red).")

        # Force Update Claims Display
        if 'الشكاوى والملاحظات' not in content:
            claims_display = """
              {/* Claims Display Section */}
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 my-2">
                <span className="text-[10px] font-bold text-blue-600 block uppercase tracking-wider mb-1">الشكاوى والملاحظات</span>
                <div className="space-y-1">
                  {agreement.claims && agreement.claims.length > 0 ? (
                    agreement.claims.map((claim, idx) => (
                      <div key={claim.id || idx} className="text-[11px] text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span className="truncate">{claim.description || 'بدون وصف'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-gray-400 italic">لا توجد شكاوى</div>
                  )}
                </div>
              </div>
"""
            # Find the grid that ends before the price section
            grid_end_marker = r'</div>\s+<div className="flex justify-between items-center pt-2">'
            content = re.sub(grid_end_marker, r'</div>' + claims_display + r'<div className="flex justify-between items-center pt-2">', content)
            print("✅ Claims display forced into Control Panel.")

        with open(cp_path, 'w', encoding='utf-8') as f:
            f.write(content)

    # 3. Update RepairAgreementForm.tsx (Terms Text Size)
    raf_path = os.path.join('src', 'features', 'agreements', 'RepairAgreementForm.tsx')
    if os.path.exists(raf_path):
        with open(raf_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Force Increase text size of the terms line
        terms_text = "أوافق على الشروط والأحكام الخاصة بمركز تقني المحركات"
        if terms_text in content and 'text-xl' not in content:
            content = content.replace(terms_text, f'<span className="text-xl font-black text-blue-900 underline decoration-blue-200 decoration-4 underline-offset-4">{terms_text}</span>')
            print("✅ Terms text size forced to Extra Large.")

        with open(raf_path, 'w', encoding='utf-8') as f:
            f.write(content)

    print("\n--- DONE ---")
    print("All fixes applied! Now run:")
    print("1. git add .")
    print("2. git commit -m 'fix: force update UI styles and status'")
    print("3. git push origin main")

if __name__ == "__main__":
    apply_fixes()
