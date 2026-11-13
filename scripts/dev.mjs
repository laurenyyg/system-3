import { spawn } from 'node:child_process';

const api = spawn('npm', ['run', 'dev:api'], { stdio: 'inherit', shell: true });
const web = spawn('npm', ['run', 'dev:web'], { stdio: 'inherit', shell: true });

function shutdown() {
  api.kill();
  web.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
