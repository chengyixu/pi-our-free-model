import { writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const dir = new URL('../docs/assets/', import.meta.url);
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const header = (width, height, label) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}"><rect width="${width}" height="${height}" fill="#f7f6ee"/><g font-family="Helvetica, Arial, sans-serif" fill="#163c32">`;
const hero = header(1600, 820, 'Pi Our Free Model — public free models in your terminal') + `
<path d="M1115 112a250 250 0 1 0 123 464" fill="none" stroke="#dfe8d5" stroke-width="75"/>
<path d="M1115 112a250 250 0 0 0-247 322" fill="none" stroke="#163c32" stroke-width="75"/>
<circle cx="1270" cy="179" r="36" fill="#b8d780"/><path d="m965 302 62 62-62 62M1058 426h68" fill="none" stroke="#163c32" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
<text x="90" y="100" font-size="19" letter-spacing="3">A NATIVE PI EXTENSION / 01</text>
<text x="86" y="252" font-size="90" font-weight="700">Our Free Model.</text>
<text x="90" y="325" font-size="36">Public models. Your terminal.</text>
<text x="90" y="418" font-size="23" fill="#486458">Discover the free pool. Keep Pi’s tools and streaming.</text>
<text x="90" y="455" font-size="23" fill="#486458">No Kilo account. No API key.</text>
<rect x="90" y="528" width="760" height="115" rx="9" fill="#163c32"/>
<text x="114" y="563" font-size="14" letter-spacing="2" fill="#c8dcad">INSTALL IN PI</text>
<text x="114" y="605" font-size="20" font-family="Menlo, monospace" fill="#f7f6ee">pi install git:github.com/chengyixu/pi-our-free-model</text>
<path d="M90 706H1510" stroke="#cbd2c2"/><text x="90" y="753" font-size="18">LIVE DISCOVERY</text><text x="355" y="753" font-size="18">NATIVE TOOL CALLS</text><text x="660" y="753" font-size="18">OPEN SOURCE · MIT</text>
<text x="1170" y="753" font-size="14" fill="#486458">Free tiers can log prompts and rate-limit.</text></g></svg>`;
const social = header(1280, 640, 'Our Free Model — native public free-model providers for Pi') + `
<rect x="860" y="72" width="330" height="330" rx="70" fill="#163c32"/>
<path d="M1110 132a112 112 0 1 0 12 220" stroke="#d9edb2" stroke-width="24" fill="none" stroke-linecap="round"/>
<path d="m977 202 44 44-44 44M1040 290h42" stroke="#f7f6ee" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<text x="70" y="90" font-size="19" letter-spacing="2">NATIVE TO PI</text><text x="65" y="217" font-size="78" font-weight="700">Our Free Model.</text>
<text x="70" y="288" font-size="32">Public models. Your terminal.</text><text x="70" y="377" font-size="23" fill="#486458">No Kilo account or API key required.</text>
<rect x="70" y="461" width="1140" height="68" rx="8" fill="#163c32"/><text x="91" y="503" font-size="22" font-family="Menlo, monospace" fill="#f7f6ee">pi install git:github.com/chengyixu/pi-our-free-model</text>
<text x="70" y="589" font-size="17" fill="#486458">LIVE DISCOVERY / STREAMING / TOOL CALLS / MIT</text><text x="898" y="589" font-size="15" fill="#486458">Respect upstream limits and privacy.</text></g></svg>`;
const lines = [
  ['$ pi install git:github.com/chengyixu/pi-our-free-model', '#d9edb2'],
  ['', '#f7f6ee'], ['/free-models', '#d9edb2'],
  ['  Our Free Model · public pool (prompts may be logged)', '#f7f6ee'],
  ['  › Laguna XS 2.1 — ofm-kilo/poolside/laguna-xs-2.1:free', '#d9edb2'],
  ['    Nemotron 3.5 Lightning · Step 5 Preview · and more', '#b9c7b9'],
  ['', '#f7f6ee'], ['/thinking → off / low / medium / high', '#d9edb2'],
  ['', '#f7f6ee'], ['> Reply with exactly PI_NATIVE_OK', '#f7f6ee'],
  ['PI_NATIVE_OK', '#d9edb2'], ['', '#f7f6ee'], ['/session → Pi tracks token usage and cost', '#b9c7b9'],
];
const walkthrough = header(1600, 980, 'Illustrated walkthrough: install, choose model, adjust thinking, use Pi') + `
<text x="70" y="85" font-size="38" font-weight="700">From install to your first answer.</text>
<text x="70" y="135" font-size="21" fill="#486458">Illustrated workflow · model names follow the live upstream catalog</text>
<rect x="70" y="192" width="1460" height="670" rx="18" fill="#102c26"/><circle cx="105" cy="222" r="7" fill="#d9edb2"/><circle cx="130" cy="222" r="7" fill="#7b9b7e"/><circle cx="155" cy="222" r="7" fill="#4f6d59"/>
<text x="1390" y="229" font-size="15" fill="#b9c7b9">pi / terminal</text>
${lines.map(([text, color], i) => `<text x="108" y="${278 + i * 42}" font-family="Menlo, monospace" font-size="23" fill="${color}">${esc(text)}</text>`).join('')}
<text x="70" y="922" font-size="19" fill="#486458">Prompts go directly to Kilo. Public free pools are not for secrets or production workloads.</text></g></svg>`;
for (const [name, svg] of [['hero', hero], ['social-card', social], ['walkthrough', walkthrough]]) {
  await writeFile(new URL(`${name}.svg`, dir), svg);
  execFileSync('rsvg-convert', ['-o', new URL(`${name}.png`, dir).pathname, new URL(`${name}.svg`, dir).pathname]);
}
console.log('Rendered reproducible hero, social preview and illustrated workflow SVG/PNG assets.');
