import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backupDirectory = join(projectRoot, 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = join(backupDirectory, `consultorio-${timestamp}.sql`);

function readEnvFile(contents) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/i))
      .filter(Boolean)
      .map(([, key, value]) => [key, value]),
  );
}

async function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  try {
    const env = readEnvFile(await readFile(join(projectRoot, 'backend', '.env'), 'utf8'));
    return env.DATABASE_URL;
  } catch {
    return undefined;
  }
}

function connectionParts(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || '5432',
    database: parsed.pathname.slice(1) || 'postgres',
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };
}

function runPgDump(connection) {
  const args = [
    '--no-owner',
    '--no-privileges',
    '--format=plain',
    '--host', connection.host,
    '--port', connection.port,
    '--username', connection.user,
    '--dbname', connection.database,
    '--file', backupPath,
  ];

  try {
    execFileSync('pg_dump', args, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env, PGPASSWORD: connection.password },
    });
    return 'pg_dump';
  } catch (error) {
    if (error.status !== 1 && error.code !== 'ENOENT') throw error;
  }

  if (connection.host !== 'localhost' && connection.host !== '127.0.0.1') {
    throw new Error('pg_dump no está instalado y la conexión no apunta al PostgreSQL local de Docker.');
  }

  const containerArgs = [
    'compose', 'exec', '-T', 'postgres-test',
    'pg_dump',
    '--no-owner',
    '--no-privileges',
    '--format=plain',
    '--username', connection.user,
    '--dbname', connection.database,
  ];
  const output = execFileSync('docker', containerArgs, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, PGPASSWORD: connection.password },
  });
  return writeFile(backupPath, output).then(() => 'docker compose exec');
}

async function sha256(path) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(path);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolveHash(hash.digest('hex')));
    stream.on('error', reject);
  });
}

const url = await databaseUrl();
if (!url) throw new Error('Define DATABASE_URL o crea backend/.env antes de ejecutar el respaldo.');

const connection = connectionParts(url);
await mkdir(backupDirectory, { recursive: true });
const method = await runPgDump(connection);
const fileStats = await stat(backupPath);
const checksum = await sha256(backupPath);

console.log(JSON.stringify({
  file: backupPath,
  sizeBytes: fileStats.size,
  sha256: checksum,
  method,
}, null, 2));
