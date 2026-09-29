import 'dotenv/config';
import { runForensicFootnoteBenchmark } from './runner';

const args = new Set(process.argv.slice(2));
const live = args.has('--live');

async function main() {
  if (!live) {
    console.log('Forensic benchmark runner ready.');
    console.log('Use --live to execute the benchmark against the configured Gemini managed agent.');
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required for --live benchmark execution.');
  }

  const report = await runForensicFootnoteBenchmark();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
