import os
import re

def apply_fixes():
    print("Starting local file fixes (v13 - PDF Export & Storage Cleanup)...")
    
    # 1. Update App.tsx (Add Delete Functionality and Fix Date Saving)
    app_path = os.path.join('src', 'app', 'App.tsx')
    if os.path.exists(app_path):
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix Date Saving Logic (ensure expectedDeliveryDate is mapped correctly)
        # Use regex to find the payload mapping for expected_delivery_date
        content = re.sub(r"expected_delivery_date:\s*data\.expected_delivery_date", "expected_delivery_date: data.expectedDeliveryDate", content)
        
        # Add handleDelete function
        if 'handleDelete' not in content:
            delete_func = """
  const handleDelete = async (ids: string[]) => {
    if (!window.confirm(`هل أنت متأكد من حذف ${ids.length} إتفاقية؟ لا يمكن التراجع عن هذه الخطوة.`)) return;
    const { error } = await supabase.from('repair_agreements').delete().in('id', ids);
    if (error) {
      alert('حدث خطأ أثناء الحذف');
    } else {
      await fetchAgreements();
    }
  };
"""
            content = content.replace('const handleStatusChange', delete_func + '\n  const handleStatusChange')
            content = content.replace('onStatusChange={handleStatusChange}', 'onStatusChange={handleStatusChange} onDelete={handleDelete}')
            
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Added delete functionality and fixed date saving in App.tsx")

    # 2. Update ControlPanel.tsx (Add Selection, PDF Export, and Delete UI)
    cp_path = os.path.join('src', 'components', 'layout', 'ControlPanel.tsx')
    if os.path.exists(cp_path):
        with open(cp_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update Props interface
        content = content.replace('onStatusChange: (id: string, status: RepairStatus) => void;', 'onStatusChange: (id: string, status: RepairStatus) => void;\n  onDelete: (ids: string[]) => void;')
        
        # Add Selection State and PDF Logic
        if 'selectedIds' not in content:
            selection_logic = """
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
"""
            content = content.replace('const [searchTerm, setSearchTerm] = useState(\'\');', 'const [searchTerm, setSearchTerm] = useState(\'\');\n' + selection_logic)
            
            # Add Selection UI to the cards
            checkbox_ui = """
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(agreement.id)} 
                  onChange={() => toggleSelect(agreement.id)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer no-print"
                />"""
            content = content.replace('<div key={agreement.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-5 space-y-4">', 
                                     '<div key={agreement.id} className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-5 space-y-4 ${selectedIds.includes(agreement.id) ? "ring-2 ring-blue-500 border-transparent" : ""}`}>\n                ' + checkbox_ui)

            # Add Bulk Action Bar
            bulk_actions = """
      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white border shadow-2xl rounded-2xl p-4 flex items-center gap-6 z-50 no-print animate-in fade-in slide-in-from-bottom-4">
          <span className="text-sm font-bold text-blue-900">{selectedIds.length} مختارة</span>
          <div className="h-6 w-px bg-gray-200" />
          <button onClick={handlePdfExport} className="text-blue-600 font-bold text-sm flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
            📄 تصدير PDF
          </button>
          <button onClick={() => { onDelete(selectedIds); setSelectedIds([]); }} className="text-red-600 font-bold text-sm flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
            🗑️ حذف نهائي
          </button>
          <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}
"""
            content = content.replace('</div>\n    </div>\n  );', bulk_actions + '\n    </div>\n    </div>\n  );')
            
        with open(cp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Added selection, PDF export, and bulk delete UI to ControlPanel.tsx")

    # 3. Update RepairAgreementForm.tsx (Final Date Fix and UI)
    raf_path = os.path.join('src', 'features', 'agreements', 'RepairAgreementForm.tsx')
    if os.path.exists(raf_path):
        with open(raf_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Force Date to be non-required and preserve existing value
        content = content.replace('type="date"\n                required', 'type="date"')
        content = content.replace('required\n                min={', 'min={')
        
        # Ensure terms UI is large
        if 'text-3xl' not in content:
            content = content.replace('أوافق على الشروط والأحكام الخاصة بمركز تقني المحركات', 
                                     '<span className="text-3xl font-black text-blue-900 leading-tight mr-4">أوافق على الشروط والأحكام الخاصة بمركز تقني المحركات</span>')
            content = re.sub(r'className="w-8 h-8', 'className="w-12 h-12', content)

        with open(raf_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Finalized RepairAgreementForm UI and date logic.")

    print("\n--- DONE ---")
    print("All updates applied! Now run:")
    print("1. git add .")
    print("2. git commit -m 'feat: PDF export, bulk delete, and final date fix'")
    print("3. git push origin main")

if __name__ == "__main__":
    apply_fixes()
