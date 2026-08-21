import re
with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

content = content.replace("  const togglePrivacy = () => {\n    if (privacyMode) {\n      setPinDialogOpen(true);\n    } else {\n      setPrivacyMode(true);\n    }\n  };\n", "")

listen_code = """
  useEffect(() => {
    const handleOpen = () => setPinDialogOpen(true);
    window.addEventListener('open-pin-dialog', handleOpen);
    return () => window.removeEventListener('open-pin-dialog', handleOpen);
  }, []);
"""

content = content.replace("const isFinanceiro = location.pathname.startsWith('/financeiro');", "const isFinanceiro = location.pathname.startsWith('/financeiro');\n" + listen_code)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
