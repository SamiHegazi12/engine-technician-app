import os
import re

def apply_fixes():
    print("Starting local file fixes (v9 - Final UI & Status Updates)...")
    
    # 1. Update index.ts (Add CANCELLED status)
    types_path = os.path.join('src', 'types', 'index.ts')
    if os.path.exists(types_path):
        with open(types_path, 'r', encoding='utf-8') as f:
            content = f.read()
        if "CANCELLED = 'ملغي'" not in content:
            content = content.replace("DELIVERED = 'تم التسليم'", "DELIVERED = 'تم التسليم',\n  CANCELLED = 'ملغي'")
            with open(types_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("✅ Added 'Cancelled' status to index.ts")

    # 2. Update ControlPanel.tsx (Colors and Layout)
    cp_path = os.path.join('src', 'components', 'layout', 'ControlPanel.tsx')
    if os.path.exists(cp_path):
        with open(cp_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix Status Colors
        old_colors = """  const getStatusColor = (status: RepairStatus) => {
    switch(status) {
      case RepairStatus.NEW: return 'bg-blue-100 text-blue-700';
      case RepairStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-700';
      case RepairStatus.WAITING_PARTS: return 'bg-orange-100 text-orange-700';
      case RepairStatus.COMPLETED: return 'bg-green-100 text-green-700';
      case RepairStatus.DELIVERED: return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };"""
        
        new_colors = """  const getStatusColor = (status: RepairStatus) => {
    switch(status) {
      case RepairStatus.NEW: return 'bg-blue-100 text-blue-700';
      case RepairStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-700';
      case RepairStatus.WAITING_PARTS: return 'bg-orange-100 text-orange-700';
      case RepairStatus.COMPLETED: return 'bg-pink-100 text-pink-700';
      case RepairStatus.DELIVERED: return 'bg-green-100 text-green-700';
      case RepairStatus.CANCELLED: return 'bg-red-600 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };"""
        
        if old_colors in content:
            content = content.replace(old_colors, new_colors)
            print("✅ Updated status color coding.")

        # Ensure ID and Claims are visible (Preserving/Refining v7 logic)
        # The serial number is already in the top left of the card in the original code.
        # We ensure the claims display is robust.
        
        if 'الشكاوى والملاحظات' not in content:
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
            marker = '</div>\n              <div className="flex justify-between items-center pt-2">'
            if marker in content:
                content = content.replace(marker, '</div>' + claims_display + marker)
                print("✅ Added claims display to Control Panel.")

        with open(cp_path, 'w', encoding='utf-8') as f:
            f.write(content)

    # 3. Update RepairAgreementForm.tsx (Terms Text Size)
    raf_path = os.path.join('src', 'features', 'agreements', 'RepairAgreementForm.tsx')
    if os.path.exists(raf_path):
        with open(raf_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Increase text size of the terms line
        old_terms_line = 'أوافق على الشروط والأحكام الخاصة بمركز تقني المحركات'
        if old_terms_line in content:
            # Look for the span or label containing this text and add text-lg or similar
            content = content.replace(old_terms_line, f'<span className="text-lg font-bold text-blue-900">{old_terms_line}</span>')
            print("✅ Increased terms text size.")

        with open(raf_path, 'w', encoding='utf-8') as f:
            f.write(content)

    # 4. App.tsx (Verify delivery date mapping and serial logic)
    app_path = os.path.join('src', 'app', 'App.tsx')
    if os.path.exists(app_path):
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Ensure mapping is correct
        content = content.replace("expected_delivery_date: data.expected_delivery_date,", "expected_delivery_date: data.expectedDeliveryDate,")
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(content)

    print("\nAll updates applied! Now run:")
    print("1. git add .")
    print("2. git commit -m 'feat: final UI refinements and cancelled status'")
    print("3. git push origin main")

if __name__ == "__main__":
    apply_fixes()
