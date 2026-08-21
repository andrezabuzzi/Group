with open('src/views/Financeiro/DespesasVariaveis.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""      setLoading(false);
    });
    return (
    <div className="space-y-8""",
"""      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, isPessoal]);

  return (
    <div className="space-y-8"""
)

with open('src/views/Financeiro/DespesasVariaveis.tsx', 'w') as f:
    f.write(content)
