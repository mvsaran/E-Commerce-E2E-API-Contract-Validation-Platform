/**
 * global-teardown.ts
 * 
 * Playwright global teardown — runs ONCE after all test specs complete.
 * 
 * Responsibilities:
 *   1. Reads the server PID saved by global-setup.ts
 *   2. Sends SIGTERM to cleanly shut down the Express server
 *   3. Removes the PID file
 */

import * as fs from 'fs';
import * as path from 'path';

const PID_FILE = path.join(__dirname, '.server-pid');

export default async function globalTeardown(): Promise<void> {
  console.log('\n🛑 [Global Teardown] Stopping Express backend...');

  if (!fs.existsSync(PID_FILE)) {
    console.log('ℹ️  No PID file found — server was not started by this process');
    return;
  }

  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);

  if (isNaN(pid)) {
    console.warn('⚠️  Invalid PID in file — skipping kill');
    fs.rmSync(PID_FILE, { force: true });
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
    console.log(`✅ Sent SIGTERM to process ${pid}`);
  } catch (err: any) {
    if (err.code === 'ESRCH') {
      console.log(`ℹ️  Process ${pid} was already terminated`);
    } else {
      console.error(`❌ Failed to kill process ${pid}:`, err.message);
    }
  } finally {
    fs.rmSync(PID_FILE, { force: true });
    console.log('🗑  PID file cleaned up\n');
  }
}
