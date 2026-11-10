#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync('src/components/SeatMap.astro', 'utf8');
const style = readFileSync('src/styles/seatmap-redesign.css', 'utf8');

for (const control of ['zoom-out', 'zoom-in', 'zoom-fit', 'zoom-reset', 'zoom-value']) {
  assert.ok(component.includes('data-seatmap-' + control), 'Missing zoom control: ' + control);
}
assert.match(component, /const ZOOM_MIN = 0\.45;/, 'Minimum zoom must be bounded');
assert.match(component, /const ZOOM_MAX = 1\.8;/, 'Maximum zoom must be bounded');
assert.match(component, /stage\.style\.zoom = String\(next\)/, 'Zoom must affect stage layout, not just transform paint');
assert.match(component, /touchmove/, 'Touch pinch handler missing');
assert.match(component, /passive: false/, 'Pinch should prevent native zoom of the whole page');
assert.match(component, /root\.parentElement !== document\.body/, 'Modal needs to escape parent stacking context');
assert.match(style, /z-index: 1200/, 'Modal must overlay sticky mobile header');
assert.match(component, /data-seatmap-center-zone/, 'Center frame geometry missing');
assert.match(component, /pointer-events/, 'Center zone frame should not block seat selections');
assert.match(style, /pointer-events: none/, 'Center frame must allow clicking seats');
assert.match(style, /\.seatmap__swatch--center/, 'Legend lacks center zone outline');
assert.match(component, /Vùng trung tâm \(tham khảo\)/, 'Avoid implying this is official provider zone data');
assert.match(component, /button\.classList\.add\('seat--selected'\)/, 'Selecting must apply dedicated CSS class');
assert.match(component, /button\.classList\.remove\('seat--selected'\)/, 'Deselecting must remove dedicated CSS class');
assert.match(component, /button\.setAttribute\('aria-pressed', 'true'\)/, 'Selected seat must remain accessible');
assert.match(style, /\.seatmap \.seat\.seat--selected[\s\S]*?background: #19b3a8 !important/, 'Teal must always override provider type color');
assert.ok(!component.includes('Mua vé'), 'Preview cannot imply it purchases tickets');

console.log('PASS: seat map zoom, selection color, central zone geometry and mobile modal precedence');
