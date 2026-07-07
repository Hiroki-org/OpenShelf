import re

with open('apps/web/src/app/settings/page.tsx', 'r') as f:
    content = f.read()

# Add missing useEffect for auth redirect
content = content.replace(
    '  const router = useRouter();\n\n  if (loading || !user) return null;',
    '''  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  if (loading || !user) return null;'''
)

with open('apps/web/src/app/settings/page.tsx', 'w') as f:
    f.write(content)
