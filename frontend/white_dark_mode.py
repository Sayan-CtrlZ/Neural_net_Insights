import os
import re

files_to_update = [
    'app/dashboard/page.tsx',
    'app/dashboard/history/page.tsx',
    'app/dashboard/layout.tsx',
    'app/page.tsx',
    'app/login/page.tsx'
]

replacements = {
    # Borders
    'dark:border-[#333333]': 'dark:border-white/20',
    'dark:border-[#2a2a2a]': 'dark:border-white/20',
    'dark:border-indigo-900/50': 'dark:border-white/20',
    'dark:border-violet-900/50': 'dark:border-white/20',
    'dark:border-white/10': 'dark:border-white/20',
    
    # Backgrounds & Gradients
    'dark:bg-indigo-900/20': 'dark:bg-white/10',
    'dark:bg-indigo-900/30': 'dark:bg-white/10',
    'dark:from-indigo-900/40': 'dark:from-white/10',
    'dark:to-blue-900/20': 'dark:to-white/5',
    'dark:from-violet-900/40': 'dark:from-white/10',
    'dark:to-fuchsia-900/20': 'dark:to-white/5',
    
    # Text
    'dark:text-indigo-200': 'dark:text-white',
    'dark:text-indigo-300': 'dark:text-white/90',
    'dark:text-indigo-400': 'dark:text-white',
    'dark:hover:text-indigo-400': 'dark:hover:text-white',
    
    'dark:text-slate-400': 'dark:text-white/60',
    'dark:text-slate-500': 'dark:text-white/40',
    'dark:text-slate-200': 'dark:text-white/80',
    'dark:text-slate-100': 'dark:text-white',
    'dark:text-slate-300': 'dark:text-white/70',
    
    # Specific elements
    'text-indigo-900 dark:text-indigo-200': 'text-indigo-900 dark:text-white',
    'text-indigo-600 dark:text-indigo-300': 'text-indigo-600 dark:text-white',
}

for filepath in files_to_update:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()

    for old, new in replacements.items():
        content = content.replace(old, new)
        
    # Extra fix for multiple duplicate text-white/40 classes if any
    content = re.sub(r'(dark:text-white/[0-9]+ )+', lambda m: m.group(1), content)

    with open(filepath, 'w') as f:
        f.write(content)

print("Converted dark mode accents to sleek bright white.")
