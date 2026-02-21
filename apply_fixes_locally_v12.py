import os
import re

def apply_fixes():
    print("Starting local file fixes (v12 - Export & Final Requirements)...")
    
    # 1. Update index.ts (Add ARCHIVED and CANCELLED statuses)
    types_path = os.path.join('src', 'types', 'index.ts')
    if os.path.exists(types_path):
        with open(types_path, 'r', encoding='utf-8') as f:
            content = f.read()
        if "ARCHIVED" not in content:
            if "CANCELLED" not in content:
                content = re.sub(r"(DELIVERED\s*=\s*'تم التسليم')", r"\1,\n  CANCELLED = 'ملغي',\n  ARCHIVED = 'مؤرشف'", content)
            else:
                content = re.sub(r"(CANCELLED\s*=\s*'ملغي')", r"\1,\n  ARCHIVED = 'مؤرشف'", content)
            with open(types_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("✅ Statuses 'ملغي' and 'مؤرشف' added to index.ts")

    # 2. Update RepairAgreementForm.tsx (Date fix, Photo Quality, Terms UI)
    raf_path = os.path.join('src', 'features', 'agreements', 'RepairAgreementForm.tsx')
    if os.path.exists(raf_path):
        with open(raf_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Date persistence - remove 'required' and handle pre-set date
        content = content.replace('type="date"\n                required', 'type="date"')
        
        # Improve Photo Quality (increase maxWidth and quality)
        content = content.replace('compressImage(reader.result as string, 800, 0.6)', 'compressImage(reader.result as string, 1600, 0.9)')
        
        # Enlarge Checkbox and Terms Text
        terms_pattern = r'(<input[^>]*type="checkbox"[^>]*checked=\{formData\.termsAccepted\}[^>]*/>)'
        new_checkbox = r'<input type="checkbox" checked={formData.termsAccepted} onChange={e => setFormData({...formData, termsAccepted: e.target.checked})} className="w-8 h-8 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />'
        content = re.sub(terms_pattern, new_checkbox, content)
        
        terms_text = "أوافق على الشروط والأحكام الخاصة بمركز تقني المحركات"
        if terms_text in content:
            content = content.replace(terms_text, f'<span className="text-2xl font-black text-blue-900 leading-tight mr-4">{terms_text}</span>')

        # Full-size photo viewing logic
        if 'window.open(photo' not in content:
            content = content.replace('src={photo}', 'src={photo} onClick={() => window.open(photo, "_blank")} style={{cursor: "zoom-in"}}')

        with open(raf_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Updated RepairAgreementForm UI and logic.")

    # 3. Update ControlPanel.tsx (Archive Status, Colors, and EXPORT FEATURE)
    cp_path = os.path.join('src', 'components', 'layout', 'ControlPanel.tsx')
    if os.path.exists(cp_path):
        with open(cp_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update Status Colors
        status_func_pattern = r"const getStatusColor = \(status: RepairStatus\) => \{.*?\};"
        new_status_func = """const getStatusColor = (status: RepairStatus) => {
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
  };"""
        content = re.sub(status_func_pattern, new_status_func, content, flags=re.DOTALL)

        # ADD EXPORT FUNCTION
        if 'handleExport' not in content:
            export_func = """
  const handleExport = () => {
    const dataStr = JSON.stringify(agreements, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `repair_agreements_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
"""
            # Insert before the return
            content = content.replace('return (', export_func + '\n  return (')
            
            # Add Export Button to Header
            header_marker = '<div className="flex gap-2 no-print">' # This might not exist in original, check for "إنشاء إتفاقية جديدة"
            if 'إنشاء إتفاقية جديدة' in content:
                export_button = '<button onClick={handleExport} className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-200 transition-all flex items-center gap-2">💾 نسخة احتياطية</button>'
                content = content.replace('<button onClick={onNew}', export_button + '<button onClick={onNew}')
            print("✅ Added Backup & Export feature.")

        with open(cp_path, 'w', encoding='utf-8') as f:
            f.write(content)

    print("\n--- DONE ---")
    print("All final fixes and Export feature applied! Now run:")
    print("1. git add .")
    print("2. git commit -m 'feat: export feature and final UI/UX refinements'")
    print("3. git push origin main")

if __name__ == "__main__":
    apply_fixes()
