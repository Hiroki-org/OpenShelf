import re

with open('apps/web/src/app/settings/page.tsx', 'r') as f:
    content = f.read()

# Replace imports
content = content.replace(
    'import { apiFetch } from "@/lib/api";\nimport { useEffect, useMemo, useState } from "react";',
    'import { useEffect } from "react";'
)

# Add ProfileForm import
content = content.replace(
    'import Link from "next/link";',
    'import Link from "next/link";\nimport { ProfileForm } from "./profile-form";'
)

# Remove state and trimmedDisplayName
content = re.sub(
    r'  const \[displayName, setDisplayName\].*?const trimmedDisplayName = useMemo\(\(\) => displayName\.trim\(\), \[displayName\]\);\n',
    '',
    content,
    flags=re.DOTALL
)

# Remove handleSave function
content = re.sub(
    r'  const handleSave = async \(\) => \{.*?\};\n',
    '',
    content,
    flags=re.DOTALL
)

# Replace the section with ProfileForm
content = re.sub(
    r'      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-7">.*?</section>',
    '      <ProfileForm user={user} refresh={refresh} />',
    content,
    flags=re.DOTALL
)

with open('apps/web/src/app/settings/page.tsx', 'w') as f:
    f.write(content)
