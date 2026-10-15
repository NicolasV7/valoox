// Register only valoox's three private commands; never print provider responses or secrets.
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { discord as words } from '../web/i18n/en/discord.ts';

const local = existsSync('.dev.vars') ? parseEnv(readFileSync('.dev.vars', 'utf8')) : {};
const setting = (name) => process.env[name] || local[name] || '';
const app = setting('DISCORD_APP_ID');
const secret = setting('DISCORD_TOKEN');
if (!/^[1-9]\d{16,19}$/.test(app) || !secret) {
  throw new Error('Set DISCORD_APP_ID and DISCORD_TOKEN in the ignored .dev.vars file first');
}

async function request(path, body) {
  const response = await fetch('https://discord.com/api/v10' + path, {
    method: body ? 'POST' : 'GET',
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
    headers: { Authorization: 'Bot ' + secret, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok)
    throw new Error('Discord configuration request failed: HTTP ' + response.status);
  return response.json();
}

const identity = await request('/applications/@me');
if (identity.id !== app) throw new Error('The bot token belongs to a different application');
if (process.argv.includes('--check')) {
  console.log('Discord application verified.');
} else {
  const commands = [
    {
      name: 'connect',
      description: words.describeConnect,
      options: [
        {
          type: 3,
          name: 'code',
          description: words.describeCode,
          required: true,
          min_length: 32,
          max_length: 32,
        },
      ],
    },
    { name: 'status', description: words.describeStatus },
    { name: 'stop', description: words.describeStop },
  ];
  for (const command of commands) {
    await request('/applications/' + app + '/commands', {
      ...command,
      type: 1,
      contexts: [1],
      integration_types: [0, 1],
    });
  }
  console.log('Registered three private valoox commands.');
}
