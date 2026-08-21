import re

with open('src/contexts/AuthContext.tsx', 'r') as f:
    content = f.read()

from_str = """  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);"""

to_str = """  useEffect(() => {
    setUser({ uid: 'test-user', displayName: 'Test User', photoURL: '' } as any);
    setLoading(false);
  }, []);"""

content = content.replace(from_str, to_str)

with open('src/contexts/AuthContext.tsx', 'w') as f:
    f.write(content)
