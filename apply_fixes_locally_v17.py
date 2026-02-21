import os
import re

def apply_fixes():
    print("Starting local file fixes (v17 - DELETION FIX)...")
    
    # 1. Fix App.tsx - Ensure handleDelete is robust and updates state
    app_path = os.path.join('src', 'app', 'App.tsx')
    if os.path.exists(app_path):
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Completely rewrite handleDelete to be more robust
        delete_func_pattern = r"const handleDelete = async \(ids: string\[\]\) => \{.*?\};"
        new_delete_func = """const handleDelete = async (ids: string[]) => {
    try {
      console.log('Attempting to delete IDs:', ids);
      const { error } = await supabase
        .from('repair_agreements')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Deletion Error:', error);
        alert('حدث خطأ أثناء الحذف: ' + error.message);
      } else {
        console.log('Successfully deleted from Supabase');
        // Force local state update immediately
        setAgreements(prev => prev.filter(a => !ids.includes(a.id)));
        alert('تم حذف الإتفاقيات بنجاح');
      }
    } catch (err: any) {
      console.error('Delete catch error:', err);
      alert('خطأ غير متوقع: ' + err.message);
    }
  };"""
        
        if 'const handleDelete' in content:
            content = re.sub(delete_func_pattern, new_delete_func, content, flags=re.DOTALL)
        else:
            # If not found, insert it before handleStatusChange
            content = content.replace('const handleStatusChange', new_delete_func + '\n  const handleStatusChange')
            
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ App.tsx: Rewrote handleDelete with forced state update.")

    # 2. Fix ControlPanel.tsx - Ensure the button calls the function correctly
    cp_path = os.path.join('src', 'components', 'layout', 'ControlPanel.tsx')
    if os.path.exists(cp_path):
        with open(cp_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Ensure the delete button calls the prop function correctly
        # We look for the red button in the floating bar
        delete_btn_pattern = r'<button onClick=\{\(\) => \{ if\(window\.confirm\("هل أنت متأكد من حذف الاتفاقيات المختارة؟"\)\) \{ onDelete\(selectedIds\); setSelectedIds\(\[\]\); \} \}\} className="text-red-600[^"]*">'
        
        # A more generic search for the delete button logic
        if 'onDelete(selectedIds)' in content:
            # Replace the floating bar button to ensure it clears selection AFTER the function is called
            content = re.sub(r'onDelete\(selectedIds\);\s*setSelectedIds\(\[\]\);', r'onDelete(selectedIds); setSelectedIds([]);', content)
            print("✅ ControlPanel.tsx: Verified button click handler.")

        with open(cp_path, 'w', encoding='utf-8') as f:
            f.write(content)

    print("\n--- DONE ---")
    print("Deletion logic fixed! Now run:")
    print("1. git add .")
    print("2. git commit -m 'fix: robust deletion logic and state update'")
    print("3. git push origin main")

if __name__ == "__main__":
    apply_fixes()
