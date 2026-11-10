#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseSeatColor, seatForeground, seatTypePalette, seatColorStyle } from '../src/lib/seat-colors.js';

// Source-supplied names do not imply a color; the Color field does.
const sourceTypes = [
  { Type: 1, Name: 'Ghế Thường', Color: '#7f55db' },
  { Type: 2, Name: 'VIP', Color: 'rgb(236, 62, 83)' },
  { Type: 3, Name: 'WAKU WAKU', Color: '#e4a43e' },
  { Type: 4, Name: 'DOKI DOKI', Color: '#e64f9e' }
];
const palette = seatTypePalette(sourceTypes);
assert.equal(palette.size, 4);
assert.equal(palette.get('1').color, '#7f55db');
assert.equal(palette.get('2').color, '#ec3e53');
assert.equal(palette.get('3').color, '#e4a43e');
assert.equal(palette.get('4').color, '#e64f9e');
assert.equal(new Set([...palette.values()].map((type) => type.color)).size, 4);
assert.equal(seatForeground('#ffffff'), '#132033');
assert.equal(seatForeground('#151515'), '#ffffff');

// Repeated/missing/invalid colors must not collapse two distinct seat types.
const ambiguousTypes = seatTypePalette([
  { Type: '1', Name: 'Ghế Thường', Color: '#7f55db' },
  { Type: '2', Name: 'WAKU WAKU', Color: '#7f55db' },
  { Type: '3', Name: 'DOKI DOKI', Color: '' },
  { Type: '4', Name: 'Khác', Color: 'red;position:absolute' }
]);
assert.equal(ambiguousTypes.size, 4);
assert.equal(new Set([...ambiguousTypes.values()].map((type) => type.color)).size, 4);
assert.equal(parseSeatColor('#abc'), '#aabbcc');
assert.equal(parseSeatColor('rgba(0,0,0,0)'), null);
assert.equal(parseSeatColor('url(javascript:alert(1))'), null);
assert.match(seatColorStyle(ambiguousTypes.get('4')), /^--seat-type-color:#[0-9a-f]{6};--seat-type-foreground:#[0-9a-f]{6}$/);
const markup = readFileSync('src/components/SeatMap.astro', 'utf8');
const css = readFileSync('src/styles/seatmap-redesign.css', 'utf8');
assert.ok(markup.includes('palette.get(String(seat.cinemaAreaCode))'), 'Seat must resolve by actual source code');
assert.ok(markup.includes('seatColorStyle(type)'), 'Seat and legend must share the same palette');
assert.ok(markup.includes('seatmap__counts'), 'Occupancy totals must not be presented as seat type colors');
assert.ok(!markup.includes("const kind = /vip/"), 'Do not infer type color from names');
assert.ok(css.includes('background: var(--seat-type-color'), 'Seat type CSS variable missing');
assert.ok(css.includes('.seatmap__swatch--type'), 'Legend color CSS variable missing');
console.log('PASS: seat type colors, duplicate/invalid data fallbacks, contrast, rendering and legend');
