#!/usr/bin/env node
// PreToolUse hook for Bash: stop commands the project rules forbid.
let raw = '';
for await (const chunk of process.stdin) raw += chunk;

let input = {};
try {
  input = JSON.parse(raw);
} catch {
  process.exit(0);
}

const command = String(input.tool_input?.command ?? '');

const rules = [
  [/\b(yarn|pnpm|bun)\s+(add|install|i)\b/, 'npm only. Use npm install, or npx expo install in apps/mobile.'],
  [/\bgit\s+commit\b[^\n]*--no-verify/, 'Do not skip the pre-commit secret scan.'],
  [/\bgit\s+push\b[^\n]*(--force|-f\b)/, 'No force push without the owner saying so.'],
  [/\bgit\s+add\b[^\n]*(-f|--force)[^\n]*\.env/, 'Never force-add env files.'],
  [/\bsupabase\s+db\s+reset\b[^\n]*--linked/, 'Resetting the linked database deletes data. Needs the owner to run it.'],
  [/\b(drop\s+(table|schema|database)|truncate\s+table)\b/i, 'Destructive SQL needs the owner\'s explicit OK.'],
];

for (const [pattern, message] of rules) {
  if (pattern.test(command)) {
    console.error(`Blocked: ${message}`);
    process.exit(2);
  }
}
process.exit(0);
