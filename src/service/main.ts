import { createLensService } from './app.ts';
import { defaultDataDir } from './discovery.ts';

const port = Number(process.env.OPENCHAMBER_SERVICE_PORT);
const token = process.env.OPENCHAMBER_SERVICE_TOKEN ?? '';

if (!Number.isInteger(port) || port <= 0 || !token) {
  console.error('Lens: OPENCHAMBER_SERVICE_PORT and OPENCHAMBER_SERVICE_TOKEN are required.');
  process.exit(1);
}

const service = createLensService({
  port,
  token,
  dataDir: process.env.OPENCHAMBER_DATA_DIR || defaultDataDir(),
  idleExitMs: 60_000,
});

await service.start();

const shutdown = (): void => {
  void service.stop().finally(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
