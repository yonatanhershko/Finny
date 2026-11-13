#!/usr/bin/env node
// PreToolUse hook for Write/Edit: stop secrets from landing in tracked files.
import { basename } from 'node:path';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;

let input = {};
try {
  input = JSON.parse(raw);
} catch {
  process.exit(0);
}

const toolInput = input.tool_input ?? {};
const filePath = String(toolInput.file_path ?? '');
const content = String(toolInput.content ?? toolInput.new_string ?? '');
const name = basename(filePath);

// Gitignored env files are the one place a secret may live.
const isLocalEnv = /^\.env(\..+)?$/.test(name) && !name.endsWith('.example');
if (isLocalEnv) process.exit(0);

const problems = [];
if (/sb_secret_[A-Za-z0-9_-]{10,}/.test(content)) problems.push('Supabase secret key');
if (/eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\./.test(content)) problems.push('JWT');
if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(content)) problems.push('private key');
if (/(EXPO_PUBLIC|NEXT_PUBLIC)_[A-Z0-9_]*(SECRET|SERVICE_ROLE)/.test(content)) {
  problems.push('secret exposed through a public env variable name');
}

if (problems.length > 0) {
  console.error(
    `Blocked: ${problems.join(', ')} in ${filePath}. Secrets go only in gitignored .env files. See .claude/rules/security.md.`,
  );
  process.exit(2);
}
process.exit(0);
