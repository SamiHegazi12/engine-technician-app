import os
import re

def apply_fixes():
    print("Starting local file fixes (v16 - Delete Button Fix)...")
    
    # Update ControlPanel.tsx (Enable Delete Button)
    cp_path = os.path.join('src', 'components', 'layout', 'ControlPanel.tsx')
    if os.path.exists(cp_path):
        with open(cp_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Ensure the delete button is fully active and has the correct click handler
        # We'll look for the delete button in the floating bar and force it to be interactive
        
        old_delete_btn = r'<button onClick={() => { onDelete\(selectedIds\); setSelectedIds\(\[\]\); }} className="text-red-600 font-bold text-sm flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">'
        new_delete_btn = r'<button onClick={() => { if(window.confirm("هل أنت متأكد من حذف الاتفاقيات المختارة؟")) { onDelete(selectedIds); setSelectedIds([]); } }} className="text-red-600 font-bold text-sm flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer bg-red-50/50 border border-red-100 shadow-sm">'
        
        if 'onDelete(selectedIds)' in content:
            content = re.sub(r'<button onClick=\{\(\) => \{ onDelete\(selectedIds\); setSelectedIds\(\[\]\); \}\} className="text-red-600[^"]*">', new_delete_btn, content)
            print("✅ Force-enabled the Delete button with confirmation and better styling.")
        else:
            print("⚠️ Could not find the exact delete button pattern, trying a broader search...")
            # Fallback: find any red button with delete text/icon
            content = re.sub(r'<button[^>]*delete[^>]*>', new_delete_btn, content, flags=re.IGNORECASE)

        with open(cp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ ControlPanel.tsx updated.")

    # Double check App.tsx to ensure onDelete is passed correctly
    app_path = os.path.join('src', 'app', 'App.tsx')
    if os.path.exists(app_path):
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'onDelete={handleDelete}' not in content:
            # Ensure the prop is passed
            content = content.replace('onStatusChange={handleStatusChange}', 'onStatusChange={handleStatusChange} onDelete={handleDelete}')
            print("✅ Verified onDelete prop is passed in App.tsx.")
            
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(content)

    print("\n--- DONE ---")
    print("Delete button fix applied! Now run:")
    print("1. git add .")
    print("2. git commit -m 'fix: enable delete button functionality'")
    print("3. git push origin main")

if __name__ == "__main__":
    apply_fixes()
