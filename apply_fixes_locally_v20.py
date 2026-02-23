import os
import re

def apply_fixes():
    print("Starting local file fixes (v20 - FORCE PROPS INJECTION)...")
    
    # 1. Update ControlPanel.tsx - Force inject onDelete into props
    cp_path = os.path.join('src', 'components', 'layout', 'ControlPanel.tsx')
    if os.path.exists(cp_path):
        with open(cp_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Ensure interface has onDelete
        if 'onDelete:' not in content:
            content = re.sub(r'(interface\s+ControlPanelProps\s*\{)', r'\1\n  onDelete: (ids: string[]) => void;', content)
            print("✅ Added onDelete to ControlPanelProps interface.")

        # Force inject into the component arguments
        # This regex looks for the destructured props inside the ControlPanel definition
        pattern = r'(const\s+ControlPanel:\s*React\.FC<ControlPanelProps>\s*=\s*\(\{)(.*?)(\}\)\s*=>)'
        def inject_on_delete(match):
            prefix = match.group(1)
            props = match.group(2)
            suffix = match.group(3)
            if 'onDelete' not in props:
                return f"{prefix}{props.strip()}, onDelete{suffix}"
            return match.group(0)

        new_content = re.sub(pattern, inject_on_delete, content, flags=re.DOTALL)
        if new_content != content:
            content = new_content
            print("✅ Force injected 'onDelete' into ControlPanel arguments.")
        else:
            print("⚠️ Could not find standard ControlPanel definition, trying alternative pattern...")
            # Alternative pattern if it's not using React.FC
            pattern2 = r'(const\s+ControlPanel\s*=\s*\(\{)(.*?)(\}\s*:\s*ControlPanelProps\)\s*=>)'
            new_content = re.sub(pattern2, inject_on_delete, content, flags=re.DOTALL)
            if new_content != content:
                content = new_content
                print("✅ Force injected 'onDelete' into ControlPanel arguments (Pattern 2).")

        with open(cp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ ControlPanel.tsx updated.")

    # 2. Update App.tsx - Ensure onDelete is passed
    app_path = os.path.join('src', 'app', 'App.tsx')
    if os.path.exists(app_path):
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'onDelete={handleDelete}' not in content:
            # Use regex to find the ControlPanel usage and add the prop
            content = re.sub(r'(<ControlPanel\s+[^>]*?onStatusChange=\{handleStatusChange\})(\s*/?>)', 
                            r'\1\n              onDelete={handleDelete}\2', content)
            print("✅ App.tsx: Injected onDelete={handleDelete} into ControlPanel usage.")
            
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ App.tsx updated.")

    print("\n--- DONE ---")
    print("V20 Force Injection applied! Now run:")
    print("1. git add .")
    print("2. git commit -m 'fix: force inject onDelete prop'")
    print("3. git push origin main")

if __name__ == "__main__":
    apply_fixes()
