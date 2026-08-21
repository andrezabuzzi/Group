import { execSync } from 'child_process';
try {
  const result = execSync('git log -p src/views/Dashboard.tsx').toString();
  console.log(result.substring(0, 10000));
} catch (e) {
  console.error("No git or other error:", e.message);
}
