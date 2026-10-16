#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin, stderr } from 'node:process';
import { LibraryClient } from './client.mjs';

const [command = 'help', ...options] = process.argv.slice(2);
const client = new LibraryClient();
const print = value => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
try {
  if (command === 'help' || command === '--help') {
    console.log(`Design system 1 libraries\n\n  ds1 login                     Sign in with an emailed code\n  ds1 logout                    Revoke this session\n  ds1 schema                    Show operations and JSON schemas\n  ds1 list\n  ds1 get --id ID\n  ds1 create --name NAME --css-file FILE --config-file FILE --template-version VERSION\n  ds1 save --id ID --css-file FILE --config-file FILE --base-rev REV\n  ds1 rename --id ID --name NAME\n  ds1 history --id ID\n  ds1 publish --id ID --base-rev REV\n  ds1 rollback --id ID --version VERSION\n\nAny operation accepts --json FILE (or --json - for stdin). Save preserves the draft revision you supply; it never auto-merges a conflict. Publish and rollback affect connected apps.\nSet DS1_API_URL for another server; DS1_TOKEN supplies an existing bearer token. ds1-mcp uses the same stored session.`);
  } else if (command === 'login') {
    if (!stdin.isTTY) throw new Error('Run login in an interactive terminal.');
    const prompt = createInterface({ input: stdin, output: stderr });
    try {
      const email = (await prompt.question('Email: ')).trim();
      await client.login(email);
      const code = (await prompt.question('Code from your email: ')).trim();
      await client.login(email, code); console.log('Signed in.');
    } finally { prompt.close(); }
  } else if (command === 'logout') { await client.logout(); console.log('Signed out.'); }
  else if (command === 'schema') print(await client.schema());
  else {
    let args = {};
    for (let i = 0; i < options.length; i += 2) {
      const option = options[i]; const value = options[i + 1];
      if (!option?.startsWith('--') || value === undefined) throw new Error('Expected --option value.');
      if (option === '--json') {
        const text = value === '-' ? await new Promise((resolve, reject) => { let data = ''; stdin.setEncoding('utf8'); stdin.on('data', part => data += part); stdin.on('end', () => resolve(data)); stdin.on('error', reject); }) : await readFile(value, 'utf8');
        args = { ...args, ...JSON.parse(text) };
      } else if (option === '--css-file' || option === '--config-file') args[option === '--css-file' ? 'css' : 'config'] = await readFile(value, 'utf8');
      else { const key = option.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase()); args[key] = ['baseRev', 'version'].includes(key) ? Number(value) : value; }
    }
    print(await client.call(command, args));
  }
} catch (error) {
  stderr.write(`${error.code ? `${error.code}: ` : ''}${error.message}\n`);
  if (error.details) stderr.write(`${JSON.stringify(error.details)}\n`);
  process.exitCode = 1;
}
