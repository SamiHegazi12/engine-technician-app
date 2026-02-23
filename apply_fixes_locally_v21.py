import os
import re

def apply_fixes():
    print("Starting local file fixes (v21 - ABSOLUTE FORCE INJECTION)...")
    
    # 1. Update ControlPanel.tsx - Absolute Force Injection
    cp_path = os.path.join('src', 'components', 'layout', 'ControlPanel.tsx')
    if os.path.exists(cp_path):
        with open(cp_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Ensure interface has onDelete
        if 'onDelete:' not in content:
            content = re.sub(r'(interface\s+ControlPanelProps\s*\{)', r'\1\n  onDelete: (ids: string[]) => void;', content)
            print("✅ ControlPanelProps interface updated.")

        # Absolute Force: Find the start of the component and replace the destructured props
        # We target the most common pattern: ({ agreements, onNew, onEdit, onStatusChange })
        # We will replace it with a version that definitely includes onDelete
        
        props_pattern = r'const\s+ControlPanel\s*:\s*React\.FC<ControlPanelProps>\s*=\s*\(\s*\{([^}]*)\}\s*\)\s*=>'
        
        def replacement(match):
            existing_props = match.group(1).strip()
            if 'onDelete' not in existing_props:
                # Clean up existing props and add onDelete
                props_list = [p.strip() for p in existing_props.split(',') if p.strip()]
                props_list.append('onDelete')
                new_props = ', '.join(props_list)
                print(f"✅ Replaced props: [{existing_props}] -> [{new_props}]")
                return f"const ControlPanel: React.FC<ControlPanelProps> = ({{ {new_props} }}) =>"
            return match.group(0)

        new_content = re.sub(props_pattern, replacement, content, flags=re.DOTALL)
        
        if new_content == content:
            # Try a second, more generic pattern if the first one fails
            props_pattern2 = r'\(\s*\{([^}]*)\}\s*:\s*ControlPanelProps\s*\)\s*=>'
            def replacement2(match):
                existing_props = match.group(1).strip()
                if 'onDelete' not in existing_props:
                    props_list = [p.strip() for p in existing_props.split(',') if p.strip()]
                    props_list.append('onDelete')
                    new_props = ', '.join(props_list)
                    print(f"✅ Replaced props (Pattern 2): [{existing_props}] -> [{new_props}]")
                    return f"({{ {new_props} }}: ControlPanelProps) =>"
                return match.group(0)
            new_content = re.sub(props_pattern2, replacement2, content, flags=re.DOTALL)

        if new_content != content:
            with open(cp_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print("✅ ControlPanel.tsx successfully modified.")
        else:
            print("❌ FAILED to find ControlPanel definition. Please check the file manually.")

    # 2. Update App.tsx - Ensure the prop is passed
    app_path = os.path.join('src', 'app', 'App.tsx')
    if os.path.exists(app_path):
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'onDelete={handleDelete}' not in content:
            # Inject it into the ControlPanel component call
            content = re.sub(r'(<ControlPanel\s+[^>]*?onStatusChange=\{handleStatusChange\})(\s*/?>)', 
                            r'\1\n              onDelete={handleDelete}\2', content)
            with open(app_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("✅ App.tsx updated with onDelete={handleDelete}.")
        else:
            print("✅ App.tsx already has onDelete={handleDelete}.")

    print("\n--- DONE ---")
    print("If you saw green checkmarks, please commit and push!")
    print("1. git add .")
    print("2. git commit -m 'fix: absolute force injection of onDelete prop'")
    print("3. git push origin main")

if __name__ == "__main__":
    apply_fixes()
