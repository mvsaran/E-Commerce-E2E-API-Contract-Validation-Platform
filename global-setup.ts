/**
 * global-setup.ts
 * 
 * Playwright global setup — runs ONCE before all test specs.
 * 
 * Responsibilities:
 *   1. Starts the Express backend server as a child process
 *   2. Polls the /health endpoint until server is ready (max 30s)
 *   3. Stores the server PID in a temp file for teardown
 * 
 * This ensures Playwright tests always run against a live backend,
 * regardless of whether the developer started the server manually.
 */

import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

const PID_FILE = path.join(__dirname, '.server-pid');
const PORT     = parseInt(process.env.PORT || '3000', 10);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const MAX_WAIT = 30_000; // 30 seconds

/**
 * Polls the /health endpoint until it responds 200,
 * or until timeout is exceeded.
 */
function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const healthUrl = `${url}/health`;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    function poll() {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Server did not start within ${timeoutMs}ms. Check backend/server.ts.`));
        return;
      }

      http.get(healthUrl, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ Backend ready at ${url}`);
          resolve();
        } else {
          setTimeout(poll, 500);
        }
      }).on('error', () => {
        // Server not up yet — retry
        setTimeout(poll, 500);
      });
    }

    poll();
  });
}

export default async function globalSetup(): Promise<void> {
  console.log('\n🚀 [Global Setup] Starting Express backend...');

  // Check if server is already running (developer may have started it manually)
  try {
    await waitForServer(BASE_URL, 2_000);
    console.log('ℹ️  Backend already running — skipping server start');
    return;
  } catch {
    // Not running — start it
  }

  // Spawn the backend server using ts-node
  const serverProcess: ChildProcess = spawn(
    'npx',
    ['ts-node', '--project', 'tsconfig.json', 'backend/server.ts'],
    {
      cwd:   __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env:   { ...process.env, PORT: String(PORT) },
    }
  );

  // Pipe server output to console with prefix
  serverProcess.stdout?.on('data', (data: Buffer) => {
    process.stdout.write(`[backend] ${data.toString()}`);
  });

  serverProcess.stderr?.on('data', (data: Buffer) => {
    const msg = data.toString();
    // Only show real errors, not ts-node warnings
    if (!msg.includes('ExperimentalWarning') && !msg.includes('DeprecationWarning')) {
      process.stderr.write(`[backend:err] ${msg}`);
    }
  });

  serverProcess.on('error', (err) => {
    console.error('❌ Failed to start backend:', err.message);
  });

  // Save PID for teardown
  if (serverProcess.pid) {
    fs.writeFileSync(PID_FILE, String(serverProcess.pid), 'utf-8');
    console.log(`📝 Server PID ${serverProcess.pid} saved to ${PID_FILE}`);
  }

  // Wait for server to be ready
  try {
    await waitForServer(BASE_URL, MAX_WAIT);
    console.log('✅ [Global Setup] Backend is ready. Starting tests...\n');
  } catch (err) {
    // Kill the failed process
    serverProcess.kill();
    fs.rmSync(PID_FILE, { force: true });
    throw err;
  }
}
