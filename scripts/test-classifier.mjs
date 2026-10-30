// Manual check of the AI classifier against real photos.
// Usage:  node scripts/test-classifier.mjs <image-url-or-path> ["optional description"]
import { readFileSync } from 'fs';
import { classifyComplaintText } from '../api/_classifier.js';

const [, , target, ...rest] = process.argv;
if (!target) {
  console.error('Usage: node scripts/test-classifier.mjs <image-url-or-file> ["description"]');
  process.exit(1);
}
const description = rest.join(' ');

let media;
if (/^https?:\/\//.test(target)) {
  media = { imageUrl: target };
} else {
  const ext = target.toLowerCase().endsWith('.png') ? 'png' : target.toLowerCase().endsWith('.webp') ? 'webp' : 'jpeg';
  media = { imageData: `data:image/${ext};base64,${readFileSync(target).toString('base64')}` };
}

const t0 = Date.now();
const result = await classifyComplaintText(description, media);
console.log(JSON.stringify(result, null, 2), `\n(${Date.now() - t0} ms)`);
