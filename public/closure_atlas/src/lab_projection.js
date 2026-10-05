// Reconstruct coarse cell-average conserved fields on the fine terrain.
// A constant coarse water depth must not be pasted onto a tall rock: solve the
// subcell water level so mean(max(eta-bed, 0)) equals the given coarse depth.
export function makeConservativeDisplay(bed, fineN = 256, coarseN = 32) {
  if (fineN % coarseN) throw new Error('grid ratio must be integral');
  const ratio = fineN / coarseN, count = ratio * ratio, cells = [];
  for (let j = 0; j < coarseN; j++) for (let i = 0; i < coarseN; i++) {
    const indices = [];
    for (let y = 0; y < ratio; y++) for (let x = 0; x < ratio; x++) indices.push((j * ratio + y) * fineN + i * ratio + x);
    cells.push(indices.sort((a, b) => bed[a] - bed[b]));
  }
  return fields => {
    const size = coarseN * coarseN;
    if (fields.length !== 3 * size) throw new Error('coarse field size mismatch');
    const h = new Float32Array(fineN * fineN), qx = new Float32Array(h.length), qy = new Float32Array(h.length);
    for (let k = 0; k < size; k++) {
      const depth = fields[k];
      if (!Number.isFinite(depth) || depth < 0) throw new Error('invalid coarse water depth');
      if (depth === 0) continue;
      const ids = cells[k], volume = depth * count;
      let sum = 0, eta = 0;
      for (let wet = 1; wet <= count; wet++) {
        sum += bed[ids[wet - 1]]; eta = (volume + sum) / wet;
        if (wet === count || eta <= bed[ids[wet]]) break;
      }
      for (const id of ids) {
        h[id] = Math.max(0, eta - bed[id]);
        qx[id] = fields[size + k] * h[id] / depth;
        qy[id] = fields[2 * size + k] * h[id] / depth;
      }
    }
    return { h, qx, qy };
  };
}
