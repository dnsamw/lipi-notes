// Run: node scripts/generate-icons.mjs
// Generates placeholder PWA icons in public/icons/
// Install canvas first: npm install canvas (optional, needs node-canvas or use an SVG fallback)

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SIZES = [192, 512];
const DIR = join(process.cwd(), "public", "icons");

mkdirSync(DIR, { recursive: true });

for (const size of SIZES) {
  // Generate a minimal SVG icon and save it as .svg
  // For production, replace with proper PNG icons
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0f0f10"/>
  <g transform="translate(${size * 0.2}, ${size * 0.1}) scale(${size / 140})">
    <path d="M20 100 L50 10 L80 100" stroke="#c9a84c" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M28 68 H72" stroke="#c9a84c" stroke-width="10" stroke-linecap="round" opacity="0.6" fill="none"/>
  </g>
</svg>`;

  writeFileSync(join(DIR, `icon-${size}.svg`), svg);
  console.log(`Generated icon-${size}.svg`);
}

console.log("Done! Replace .svg files with proper .png icons for production.");
