import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(projectRoot, 'dist');
const inlineInvitation = {
  name: 'inline-invitation-for-file-open',
  apply: 'build',
  closeBundle() {
    const builtPage = path.join(distDir, 'app.html');
    if (!fs.existsSync(builtPage)) return;
    let html = fs.readFileSync(builtPage, 'utf8');
    const reference = html.match(/<script type="module" crossorigin src="([^"]+)"[^>]*><\/script>/);
    if (!reference) throw new Error('Could not find the Vite application script in dist/app.html.');
    const scriptPath = path.join(distDir, reference[1].replace(/^\.\//, ''));
    let code = fs.readFileSync(scriptPath, 'utf8');
    const ringModel = fs.readFileSync(path.join(projectRoot, 'public', 'assets', 'ring_02.glb')).toString('base64');
    code = code.replaceAll('./assets/ring_02.glb', `data:model/gltf-binary;base64,${ringModel}`);
    if (/\bimport\s*\(/.test(code) || /^\s*import\b/m.test(code) || code.includes('import.meta')) {
      throw new Error('The local invitation bundle still contains module-only syntax.');
    }
    code = code.replace(/<\/script/gi, '<\\/script');
    html = html.replace(reference[0], '');
    html = html.replace(/<script type="module">[\s\S]*?<\/script>/g, '');
    html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');
    html = html.replace(/(<link rel="stylesheet[^>]*?)\s+crossorigin(?=[\s>])/gi, '$1');
    html = html.replace('</body>', () => `<script>${code}</script>\n  </body>`);
    const stylesheet = html.match(/<link rel="stylesheet" href="([^"]+)"[^>]*>/);
    if (!stylesheet) throw new Error('Could not find the Vite stylesheet in dist/app.html.');
    const stylesheetPath = path.join(distDir, stylesheet[1].replace(/^\.\//, ''));
    const styles = fs.readFileSync(stylesheetPath, 'utf8').replace(/<\/style/gi, '<\\/style');
    const productionHtml = html.replace(stylesheet[0], `<style>${styles}</style>`);
    fs.writeFileSync(builtPage, productionHtml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'index.html'), productionHtml, 'utf8');
    const rootHtml = productionHtml.replaceAll('./assets/', './dist/assets/');
    fs.writeFileSync(path.join(projectRoot, 'index.html'), rootHtml, 'utf8');
  }
};

export default defineConfig({
  base: './',
  publicDir: 'public',
  server: { open: '/app.html' },
  plugins: [inlineInvitation],
  build: { outDir: 'dist', emptyOutDir: true, rollupOptions: { input: 'app.html' } }
});



