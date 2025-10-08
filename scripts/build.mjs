import { build } from 'esbuild';
import { mkdirSync, copyFileSync, existsSync } from 'fs';

const outdir = 'dist';

async function bundle(entry, outfile, format = 'iife') {
  await build({
    entryPoints: [entry],
    bundle: true,
    outfile: `${outdir}/${outfile}`,
    target: ['firefox109'],
    format,
    platform: 'browser',
    sourcemap: true,
    legalComments: 'none',
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    }
  });
}

async function main() {
  if (!existsSync(outdir)) {
    mkdirSync(outdir, { recursive: true });
  }
  // Bundle scripts
  await bundle('src/background.ts', 'background.js', 'iife');
  await bundle('src/content.ts', 'content.js', 'iife');
  await bundle('src/popup.ts', 'popup.js', 'iife');
  await bundle('src/options.ts', 'options.js', 'iife');

  // Copy HTML and manifest
  copyFileSync('src/popup.html', `${outdir}/popup.html`);
  copyFileSync('src/options.html', `${outdir}/options.html`);
  copyFileSync('manifest.json', `${outdir}/manifest.json`);

  // Copy icons
  mkdirSync(`${outdir}/icons`, { recursive: true });
  try {
    copyFileSync('skap.ico', `${outdir}/icons/skap.ico`);
  } catch (e) {
    console.warn('Icon skap.ico not found at root; ensure it exists.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});