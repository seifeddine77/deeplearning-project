const fs = require('fs');
const path = require('path');

function randn(seedObj) {
  // Box-Muller with tiny LCG
  seedObj.s = (seedObj.s * 1664525 + 1013904223) >>> 0;
  const u1 = (seedObj.s / 0xffffffff) || 1e-9;
  seedObj.s = (seedObj.s * 1664525 + 1013904223) >>> 0;
  const u2 = (seedObj.s / 0xffffffff) || 1e-9;
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function main() {
  const outPath = process.argv[2] || path.join(process.cwd(), 'datasets', 'sample_lstm_sequence.csv');
  const rows = Math.max(200, Number(process.argv[3] || 1200));
  const features = Math.max(2, Number(process.argv[4] || 10));

  const seed = { s: 123456789 };

  const header = [];
  for (let i = 1; i <= features; i++) header.push(`f${i}`);
  header.push('label');

  const lines = [header.join(',')];

  // Create an easy-to-learn pattern: label flips every 100 timesteps,
  // and feature means depend on label.
  const block = 100;
  for (let t = 0; t < rows; t++) {
    const label = Math.floor(t / block) % 2 === 0 ? 'A' : 'B';
    const base = label === 'A' ? 0.0 : 2.5;

    const row = [];
    for (let j = 0; j < features; j++) {
      // Add some periodic signal + noise
      const periodic = Math.sin((t / 10) + j) * 0.25;
      const noise = randn(seed) * 0.15;
      row.push((base + periodic + noise).toFixed(6));
    }
    row.push(label);
    lines.push(row.join(','));
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.log(`OK: ${outPath}`);
  console.log(`rows=${rows} features=${features} labels=2`);
}

main();
