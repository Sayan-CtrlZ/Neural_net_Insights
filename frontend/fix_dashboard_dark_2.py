import re

filepath = 'app/dashboard/page.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# Fix Enterprise Pipeline Active box
content = content.replace('dark:bg-indigo-900/20/40', 'dark:bg-indigo-900/20')
content = content.replace('text-indigo-900/60', 'text-indigo-900/60 dark:text-indigo-200/80')

# Fix Select input dark mode states
content = content.replace('disabled:bg-slate-50 dark:bg-[#1a1a1a]', 'dark:bg-[#121212] disabled:bg-slate-50 dark:disabled:bg-[#1a1a1a]')

# Fix Upload Source select box styling
content = content.replace('bg-slate-50 dark:bg-[#1a1a1a] border-slate-200 dark:border-[#333333]', 'bg-slate-50 dark:bg-[#1a1a1a] border-slate-200 dark:border-[#333333] hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors')

# Fix right panel background
content = content.replace('bg-white dark:bg-[#121212] overflow-y-auto', 'bg-white dark:bg-[#1a1a1a] overflow-y-auto')

# Ensure Data Preview Header is dark properly
content = content.replace('bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200', 'bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-[#333333]')

with open(filepath, 'w') as f:
    f.write(content)

print("Applied more precise dark mode fixes.")
