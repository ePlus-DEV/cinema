/**
 * Approximate the visual middle of the main seating block.
 * This is NOT a provider-defined best-seat or premium-zone classification.
 *
 * Input: [{ seats: [{ x, y, width, height }, ...] }, ...]
 * Occupancy and seat type do not influence geometry.
 */
export function estimateCenterZone(rows) {
  if (!Array.isArray(rows)) return null;
  const validRows = rows.map(row => {
    const seats = (row?.seats || []).filter(p =>
      [p.x, p.y, p.width, p.height].every(Number.isFinite) && p.width > 0 && p.height > 0);
    if (!seats.length) return null;
    return {
      seats,
      top: Math.min(...seats.map(p => p.y)),
      bottom: Math.max(...seats.map(p => p.y + p.height)),
      height: Math.max(...seats.map(p => p.height))
    };
  }).filter(Boolean).sort((a,b) => a.top - b.top);
  if (validRows.length < 4) return null;

  // A blank aisle between successive banks must never be spanned by one frame.
  const gaps = validRows.slice(1).map((row,i) => Math.max(0, row.top - validRows[i].bottom));
  const sorted = [...gaps].sort((a,b) => a-b);
  const medianGap = sorted.length ? sorted[Math.floor((sorted.length-1)/2)] : 0;
  const maxSeatHeight = Math.max(...validRows.map(row=>row.height));
  const aisleThreshold = Math.max(maxSeatHeight * 0.7, medianGap * 2.4);

  const blocks = [];
  let block = [validRows[0]];
  for (let i = 1; i < validRows.length; i++) {
    if (gaps[i-1] > aisleThreshold) {
      blocks.push(block);
      block = [];
    }
    block.push(validRows[i]);
  }
  blocks.push(block);

  // The main continuous auditorium block is the block with the most seats.
  // A smaller detached row/bank at the back is not included in its box.
  const primary = blocks.reduce((best, current) => {
    const count = a => a.reduce((sum,row)=>sum + row.seats.length,0);
    return count(current)>count(best) ? current : best;
  }, blocks[0]);
  // Scale with room size: in a tiny auditorium (fewer than 5 main rows or
  // fewer than 40 seats in the whole room — e.g. a 4-row, 32-seat premium
  // room) practically every seat is "central", so a frame would be
  // misleading pseudo-precision. Draw nothing there.
  const totalSeats = validRows.reduce((sum, row) => sum + row.seats.length, 0);
  if (primary.length < 5 || totalSeats < 40) return null;

  // A central viewing band is typically around the middle/back-middle of the
  // main uninterrupted seat bank. Use 40–90% (row indices are screen-to-back).
  const start = Math.floor(primary.length * 0.4);
  const end = Math.max(start + 1, Math.ceil(primary.length * 0.9) - 1);
  const middleRows = primary.slice(start, Math.min(primary.length,end+1));
  const seats = middleRows.flatMap(row=>row.seats);
  if (seats.length < 6) return null;

  // Center on the dominant column bank when the middle rows are split
  // unevenly (e.g. a 2-seat side bank next to the main 8-seat bank would
  // otherwise drag the "center" sideways). Balanced splits (8+8 across a
  // center aisle) keep the full-span center: there the middle seats really
  // are the aisle-adjacent ones on both sides.
  let minX = Math.min(...seats.map(s=>s.x));
  let maxX = Math.max(...seats.map(s=>s.x+s.width));
  const sortedByX = [...seats].sort((a, b) => a.x - b.x);
  const seatPitch = sortedByX.length > 1
    ? Math.min(...sortedByX.slice(1).map((s, i) => s.x - sortedByX[i].x).filter(d => d > 0))
    : 0;
  const banks = [];
  let bank = [sortedByX[0]];
  for (let i = 1; i < sortedByX.length; i++) {
    const gap = sortedByX[i].x - (sortedByX[i - 1].x + sortedByX[i - 1].width);
    if (seatPitch && gap > seatPitch * 0.6) { banks.push(bank); bank = []; }
    bank.push(sortedByX[i]);
  }
  if (sortedByX.length) banks.push(bank);
  if (banks.length > 1) {
    const dominant = banks.reduce((a, b) => (b.length > a.length ? b : a), banks[0]);
    if (dominant.length >= seats.length * 0.6 && dominant.length < seats.length) {
      minX = Math.min(...dominant.map(s => s.x));
      maxX = Math.max(...dominant.map(s => s.x + s.width));
    }
  }
  const centerX = (minX+maxX)/2;
  const halfBand = (maxX-minX)*0.22;
  const centralSeats = seats.filter(seat => {
    const mid = seat.x + seat.width/2;
    return mid>=centerX-halfBand && mid<=centerX+halfBand;
  });
  if (centralSeats.length < 6) return null;

  const left = Math.min(...centralSeats.map(s=>s.x));
  const right = Math.max(...centralSeats.map(s=>s.x+s.width));
  // Use only the chosen continuous rows, including the end row even when
  // its central seats happen to be occupied (occupied still counts above).
  const top = middleRows[0].top;
  const bottom = middleRows[middleRows.length-1].bottom;

  return {
    x: left-5, y: top-5,
    width: right-left+10, height: bottom-top+10,
    firstMainRow: start, lastMainRow: Math.min(primary.length-1,end),
    mainRowCount: primary.length, blockCount: blocks.length
  };
}
