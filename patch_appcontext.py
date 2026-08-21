import re
with open('src/contexts/AppContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("  privacyMode: boolean;\n  setPrivacyMode: (val: boolean) => void;\n}", "  privacyMode: boolean;\n  setPrivacyMode: (val: boolean) => void;\n  togglePrivacy: () => void;\n}")
content = content.replace("  const [privacyMode, setPrivacyMode] = useState(true);\n\n  return (", "  const [privacyMode, setPrivacyMode] = useState(true);\n\n  const togglePrivacy = () => {\n    if (privacyMode) {\n      window.dispatchEvent(new Event('open-pin-dialog'));\n    } else {\n      setPrivacyMode(true);\n    }\n  };\n\n  return (")
content = content.replace("privacyMode, setPrivacyMode }>", "privacyMode, setPrivacyMode, togglePrivacy }>")

with open('src/contexts/AppContext.tsx', 'w') as f:
    f.write(content)
