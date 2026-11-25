// Builds the tree as a single HTML page for a Claude artifact:
//   npm run build:artifact  ->  artifact/drzewo.html
// The page keeps its data in the artifact's shared database (`db` capability),
// so everyone the artifact is shared with edits the same tree.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const out = 'dist-artifact';
execSync('npx vite build --mode artifact', { stdio: 'inherit' });

let html = readFileSync(join(out, 'index.html'), 'utf8');
const read = rel => readFileSync(join(out, rel.replace(/^\.\//, '')), 'utf8');

const css = [...html.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map(m => read(m[1])).join('\n');
const js = [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g)].map(m => read(m[1])).join('\n');
const fonts = (html.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/) || [''])[0];

const page = `<title>Drzewo Genealogiczne</title>
${fonts}
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js.replace(/<\/script/gi, '<\\/script')}
</script>
`;

mkdirSync('artifact', { recursive: true });
writeFileSync('artifact/drzewo.html', page);
console.log(`artifact/drzewo.html: ${(page.length / 1024).toFixed(0)} KB`);
