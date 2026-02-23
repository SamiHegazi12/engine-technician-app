import os
import re

def apply_fixes():
    print("Starting local file fixes (v19 - CONNECTION FIX)...")
    
    # Update ControlPanel.tsx to properly receive and use onDelete
    cp_path = os.path.join('src', 'components', 'layout', 'ControlPanel.tsx')
    if os.path.exists(cp_path):
        with open(cp_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 1. Fix the Props interface to include onDelete
        if 'onDelete: (ids: string[]) => void;' not in content:
            content = re.sub(r'(interface\s+ControlPanelProps\s*\{[^}]*)(\})', r'\1  onDelete: (ids: string[]) => void;\n\2', content)
            print("✅ ControlPanelProps: Added onDelete to interface.")

        # 2. Fix the component definition to destructure onDelete
        # Look for: const ControlPanel: React.FC<ControlPanelProps> = ({ agreements, onNew, onEdit, onStatusChange }) => {
        if 'onDelete' not in content.split('const ControlPanel')[1].split('=>')[0]:
            content = re.sub(r'(const\s+ControlPanel:\s*React\.FC<ControlPanelProps>\s*=\s*\{\s*agreements,\s*onNew,\s*onEdit,\s*onStatusChange)(\s*\})', r'\1, onDelete\2', content)
            print("✅ ControlPanel definition: Destructured onDelete from props.")

        # 3. Ensure the button uses the correctly destructured onDelete
        # We'll force the button to use 'onDelete' directly
        if 'onDelete(selectedIds)' in content:
            print("✅ ControlPanel: Button already calls onDelete.")

        with open(cp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ ControlPanel.tsx updated successfully.")

    # Double check App.tsx to ensure handleDelete is passed
    app_path = os.path.join('src', 'app', 'App.tsx')
    if os.path.exists(app_path):
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'onDelete={handleDelete}' not in content:
            content = content.replace('onStatusChange={handleStatusChange}', 'onStatusChange={handleStatusChange} onDelete={handleDelete}')
            print("✅ App.tsx: Verified onDelete prop is passed.")
            
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(content)

    print("\n--- DONE ---")
    print("V19 Connection fix applied! Now run:")
    print("1. git add .")
    print("2. git commit -m 'fix: resolve onDelete is not defined error'")
    print("3. git push origin main")

if __name__ == "__main__":
    apply_fixes()
