import os
import re

def apply_fixes():
    print("Starting local file fixes (v18 - DEEP DEBUG DELETION)...")
    
    # Update App.tsx with aggressive deletion and detailed error reporting
    app_path = os.path.join('src', 'app', 'App.tsx')
    if os.path.exists(app_path):
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Aggressive handleDelete with detailed alerts
        delete_func_pattern = r"const handleDelete = async \(ids: string\[\]\) => \{.*?\};"
        new_delete_func = """const handleDelete = async (ids: string[]) => {
    try {
      console.log('V18: Deleting IDs:', ids);
      
      // Attempt deletion
      const { data, error, status, statusText } = await supabase
        .from('repair_agreements')
        .delete()
        .in('id', ids)
        .select(); // Adding .select() sometimes helps verify if rows were actually affected

      if (error) {
        console.error('V18 Delete Error:', error);
        alert(`فشل الحذف!\\nالسبب: ${error.message}\\nالكود: ${error.code}\\nالحالة: ${status} ${statusText}`);
      } else if (!data || data.length === 0) {
        console.warn('V18: No rows deleted. This usually means RLS (Security) is blocking it.');
        alert('تنبيه: لم يتم حذف أي بيانات. قد يكون هناك قيود أمان (RLS) في قاعدة البيانات تمنع الحذف.');
      } else {
        console.log('V18: Success!', data);
        setAgreements(prev => prev.filter(a => !ids.includes(a.id)));
        alert(`تم حذف ${data.length} إتفاقية بنجاح`);
      }
    } catch (err: any) {
      console.error('V18 Catch:', err);
      alert('خطأ فني: ' + err.message);
    }
  };"""
        
        if 'const handleDelete' in content:
            content = re.sub(delete_func_pattern, new_delete_func, content, flags=re.DOTALL)
        else:
            content = content.replace('const handleStatusChange', new_delete_func + '\n  const handleStatusChange')
            
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ App.tsx: Updated with Deep Debug deletion logic.")

    print("\n--- DONE ---")
    print("V18 script ready! Please run:")
    print("1. git add .")
    print("2. git commit -m 'fix: v18 deep debug deletion'")
    print("3. git push origin main")

if __name__ == "__main__":
    apply_fixes()
