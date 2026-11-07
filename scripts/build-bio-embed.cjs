const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/bio-markdown.js'), 'utf8').replace(/\r\n/g, '\n');
const renderer = source.slice(source.indexOf('// Shared safe'), source.indexOf('\nif (typeof module'));
const target = path.join(root, 'embed.js');
const before = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
if (!before.includes('  // BEGIN GENERATED BIO RENDERER\n')) throw new Error('Missing renderer markers');
const after = before.replace(/(  \/\/ BEGIN GENERATED BIO RENDERER\n)[\s\S]*?(  \/\/ END GENERATED BIO RENDERER)/, (_, start, end) => start + renderer + end);
if (process.argv.includes('--check')) {
  if (before !== after) throw new Error('Run node scripts/build-bio-embed.cjs to sync the embed renderer');
} else fs.writeFileSync(target, after);
