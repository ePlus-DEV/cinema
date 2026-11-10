#!/usr/bin/env node
import assert from 'node:assert/strict';
import { estimateCenterZone } from '../src/lib/seat-center-zone.js';

const createRow = (y, xs, occupied = false) => ({
  seats: xs.map(x=>({x,y,width:27,height:27,occupied}))
});

// Reproduces the reported CGV layout: eight contiguous rows A-H, then a
// detached, smaller J-K block separated by a walkable aisle. The old algorithm
// stretched the center frame from D to J; the new one MUST stop by H.
const mainXs = [300,334,368,402,436,470,504,538];
const frontBank = Array.from({length:8},(_,i)=>createRow(i*35,mainXs,i>4));
const rearBank = [createRow(365,[140,174,...mainXs]),createRow(400,[140,174,...mainXs])];
const cg = estimateCenterZone([...frontBank,...rearBank]);
assert.ok(cg, 'CGV center frame should exist');
assert.equal(cg.blockCount,2,'Detached back-row bank must not merge into main');
assert.equal(cg.mainRowCount,8,'A-H are the main continuous block');
assert.equal(cg.firstMainRow,3,'Central rows should start around row D');
assert.equal(cg.lastMainRow,7,'Central rows must stop at row H');
assert.ok(cg.y>frontBank[2].seats[0].y,'Frame starts behind front rows');
assert.ok(cg.y+cg.height<rearBank[0].seats[0].y,
  'Frame MUST NOT cross the physical aisle before J');
assert.ok(cg.x>285 && cg.x+cg.width<555,'Frame stays near central occupied seats');
assert.ok(cg.width>40 && cg.height>70,'Frame should cover meaningful seats');

// All-occupied geometry must produce the same location; availability cannot
// change which seating area is objectively in the middle.
const blocked = estimateCenterZone([...frontBank,...rearBank].map(r => ({
  seats: r.seats.map(s=>({...s,occupied:true}))
})));
assert.deepEqual(blocked,cg,'Seat occupancy cannot alter central-zone position');

// A normal theater with no aisle produces one meaningful box.
const standard = estimateCenterZone(
  Array.from({length:11},(_,i)=>createRow(i*34,Array.from({length:12},(_,j)=>j*34)))
);
assert.ok(standard && standard.blockCount===1);
assert.ok(standard.x>70 && standard.x+standard.width<340);
assert.ok(standard.lastMainRow<11);

// A rear block with more seats than the front should be selected on its own,
// rather than combining separated seating sections into an enormous rectangle.
const rearBig = [
  ...[0,35,70,105].map(y=>createRow(y,[80,115,150,185,220,255])),
  ...[200,235,270,305,340,375,410].map(y=>createRow(y,[0,35,70,105,140,175,210,245,280,315]))
];
const rearZone=estimateCenterZone(rearBig);
assert.equal(rearZone.blockCount,2);
assert.equal(rearZone.mainRowCount,7);
assert.ok(rearZone.y>=200,'Choose main contiguous rear block, without crossing aisle');

// Do not draw misleading pseudo-precision for tiny or malformed seating plans.
assert.equal(estimateCenterZone([]),null);
assert.equal(estimateCenterZone([createRow(0,[1]),createRow(35,[1])]),null);
assert.equal(estimateCenterZone([{seats:[{x:NaN,y:1,width:1,height:1}]}]),null);
console.log('PASS: center frame avoids the H-J aisle, uses the main bank, and ignores occupancy');
