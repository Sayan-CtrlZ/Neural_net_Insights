import re

filepath = 'app/dashboard/history/page.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Clean up duplicated dark classes
content = re.sub(r'(dark:text-slate-[0-9]+ )+', lambda m: m.group(1), content)
content = content.replace('dark:text-slate-500 dark:text-slate-400', 'dark:text-slate-400')
content = content.replace('dark:text-slate-400 dark:text-slate-500', 'dark:text-slate-400')
content = content.replace('hover:bg-slate-50 dark:bg-[#1a1a1a]', 'hover:bg-slate-50 dark:hover:bg-[#1a1a1a]')
content = content.replace('divide-slate-100', 'divide-slate-100 dark:divide-[#2a2a2a]')
content = content.replace('border-slate-100 dark:border-white/10', 'border-slate-100 dark:border-[#2a2a2a]')

with open(filepath, 'w') as f:
    f.write(content)

print("Cleaned up history dark mode classes.")
