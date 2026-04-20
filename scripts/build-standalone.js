// Generates a self-contained linkedin-designer.html
// Usage: node scripts/build-standalone.js
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'src', 'linkedin');

const stripModules = (code) =>
  code
    .replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?\s*\n/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+/gm, '')
    .trim();

const files = [
  'tokens.js',
  'defaults.js',
  'storage.js',
  'schema.js',
  'primitives.jsx',
  'ImageSlot.jsx',
  'templates.jsx',
  'TweaksPanel.jsx',
  'Designer.jsx',
];

const combined = files
  .map(f => {
    const code = fs.readFileSync(path.join(base, f), 'utf8');
    return `/* ─── ${f} ─── */\n${stripModules(code)}`;
  })
  .join('\n\n');

const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Studio Fuchs · LinkedIn Post Designer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; }
    body { font-family: "Inter", -apple-system, sans-serif; }
    textarea, input, select, button { font-family: inherit; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
  </style>
</head>
<body>
  <div id="root" style="height:100vh"></div>
  <script type="text/babel" data-presets="react">
    const { useState, useCallback, useRef } = React;

${combined}

    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Designer));
  </script>
</body>
</html>
`;

const out = path.join(__dirname, '..', 'public', 'linkedin-designer.html');
fs.writeFileSync(out, html, 'utf8');
console.log('✓ Generated:', out, '(' + Math.round(fs.statSync(out).size / 1024) + ' KB)');
