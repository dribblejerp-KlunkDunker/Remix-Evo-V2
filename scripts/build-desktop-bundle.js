import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function addDirectoryToZip(zip, dirPath, zipFolder) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const targetPath = zipFolder ? `${zipFolder}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        const subFolder = zip.folder(targetPath);
        await addDirectoryToZip(zip, fullPath, targetPath);
      }
    } else {
      zip.file(targetPath, fs.readFileSync(fullPath));
    }
  }
}

async function buildDesktopBundle() {
  const distDir = path.resolve('dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const zip = new JSZip();

  // 1. Launchers
  if (fs.existsSync('packaging/desktop/remix-evo-win.bat')) {
    zip.file('remix-evo-win.bat', fs.readFileSync('packaging/desktop/remix-evo-win.bat'));
  }
  if (fs.existsSync('packaging/desktop/remix-evo-mac-linux.sh')) {
    zip.file('remix-evo-mac-linux.sh', fs.readFileSync('packaging/desktop/remix-evo-mac-linux.sh'));
  }

  // 2. Readme
  const readme = `===================================================================
Remix Evo - Autonomous Evolution Research Agent Matrix
Desktop Laptop Edition
===================================================================

HOW TO RUN ON YOUR LAPTOP:

WINDOWS LAPTOP:
1. Double-click "remix-evo-win.bat"
2. The batch script will check for Node.js, install dependencies if needed,
   start the server, and open http://localhost:3000 in your browser!

MACBOOK / MACOS:
1. Open Terminal and cd into this folder
2. Run:
   chmod +x remix-evo-mac-linux.sh
   ./remix-evo-mac-linux.sh
3. The app will launch and open http://localhost:3000!

LINUX LAPTOP:
1. Open terminal and run: ./remix-evo-mac-linux.sh
   (Or if on Ubuntu/Debian/Chromebook, install the .deb package directly)

CONFIGURING SECRETS:
- Open .env in any text editor.
- GEMINI_API_KEY is pre-configured.
- Add ANTHROPIC_API_KEY, OPENAI_API_KEY, DEEPSEEK_API_KEY, or GROQ_API_KEY as desired.
===================================================================
`;
  zip.file('README-LAPTOP.txt', readme);

  // 3. Root files
  const rootFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'index.css',
    'index.tsx',
    'server.ts',
    '.env.example',
    '.env'
  ];

  for (const f of rootFiles) {
    if (fs.existsSync(f)) {
      zip.file(f, fs.readFileSync(f));
    }
  }

  // 4. Source trees
  console.log('Adding src, server, public directories to zip...');
  await addDirectoryToZip(zip, 'src', 'src');
  await addDirectoryToZip(zip, 'server', 'server');
  await addDirectoryToZip(zip, 'public', 'public');
  if (fs.existsSync('agent')) {
    await addDirectoryToZip(zip, 'agent', 'agent');
  }

  console.log('Compressing zip archive...');
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  const zipPath = path.join(distDir, 'remix-evo-desktop.zip');
  fs.writeFileSync(zipPath, buffer);
  console.log(`Desktop bundle successfully created: ${(buffer.length / 1024 / 1024).toFixed(2)} MB at ${zipPath}`);
}

buildDesktopBundle().catch((err) => {
  console.error('Failed to create desktop bundle:', err);
  process.exit(1);
});
