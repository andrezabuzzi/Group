import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

from_str = """const router = createBrowserRouter(["""
to_str = """import { useRouteError } from 'react-router';

function RootError() {
  const error = useRouteError() as any;
  console.error("APP CRASH:", error);
  return <div style={{padding: 20, color: 'red'}}>
    <h1>Global Error</h1>
    <pre>{error?.message || String(error)}</pre>
    <pre>{error?.stack}</pre>
  </div>;
}

const router = createBrowserRouter(["""

content = content.replace(from_str, to_str)
content = content.replace("element: <ProtectedRoute />,", "element: <ProtectedRoute />,\n    errorElement: <RootError />,")

with open('src/App.tsx', 'w') as f:
    f.write(content)
