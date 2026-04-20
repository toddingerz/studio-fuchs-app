// Design tokens for each LinkedIn post version.
// A "version" is a look-and-feel (fonts + colors). Text content, images
// and the underlying 9 templates are shared across versions.
//
// Add a new version by appending to VERSIONS below — the Designer picks it
// up automatically.

export const V1_TOKENS = {
  paper: '#f5f2ec',
  paperDeep: '#ebe6dc',
  ink: '#1a2a33',
  inkSoft: '#4a5a66',
  inkMute: '#8a8478',
  line: '#d9d2c4',
  marine: '#003049',
  marineDeep: '#00233a',
  sky: '#6fbef3',
  skyPale: '#d4eaf9',
  accent: '#c7511f',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
  display: '"Instrument Serif", "Playfair Display", Georgia, serif',
  text: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  headlineItalic: true,
};

export const V2_TOKENS = {
  paper: '#ffffff',
  paperDeep: '#f7f9fb',
  ink: '#1a2a33',
  inkSoft: '#4a5a66',
  inkMute: '#8a969e',
  line: '#e4e8ec',
  marine: '#004d71',
  marineDeep: '#00334a',
  sky: '#6fbef3',
  skyPale: '#e3f1fb',
  accent: '#c7511f',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
  display: '"Inter", -apple-system, sans-serif',
  text: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headlineItalic: false,
};

export const VERSIONS = [
  {
    id: 'v1',
    name: 'V1 · Editorial',
    tagline: 'Beige · Serif-Display · typografisch',
    tokens: V1_TOKENS,
    builtin: true,
  },
  {
    id: 'v2',
    name: 'V2 · Homepage-nah',
    tagline: 'Weiß · Sans · Trust-Zahlen · Kundenlogos',
    tokens: V2_TOKENS,
    builtin: true,
  },
];
