export function raycast(origin, direction, maxDist, getBlock) {
  let { x, y, z } = origin;
  const { x: dx, y: dy, z: dz } = direction;

  let ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const stepX = dx >= 0 ? 1 : -1;
  const stepY = dy >= 0 ? 1 : -1;
  const stepZ = dz >= 0 ? 1 : -1;

  const tDx = Math.abs(dx) < 1e-10 ? Infinity : Math.abs(1 / dx);
  const tDy = Math.abs(dy) < 1e-10 ? Infinity : Math.abs(1 / dy);
  const tDz = Math.abs(dz) < 1e-10 ? Infinity : Math.abs(1 / dz);

  let tMaxX = dx >= 0 ? (ix + 1 - x) * tDx : (x - ix) * tDx;
  let tMaxY = dy >= 0 ? (iy + 1 - y) * tDy : (y - iy) * tDy;
  let tMaxZ = dz >= 0 ? (iz + 1 - z) * tDz : (z - iz) * tDz;

  let prevX = ix, prevY = iy, prevZ = iz;

  for (let i = 0; i < maxDist * 4; i++) {
    const block = getBlock(ix, iy, iz);
    if (block !== 0) {
      return { hit: true, x: ix, y: iy, z: iz, prevX, prevY, prevZ };
    }

    prevX = ix; prevY = iy; prevZ = iz;

    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      if (tMaxX > maxDist) break;
      ix += stepX; tMaxX += tDx;
    } else if (tMaxY < tMaxZ) {
      if (tMaxY > maxDist) break;
      iy += stepY; tMaxY += tDy;
    } else {
      if (tMaxZ > maxDist) break;
      iz += stepZ; tMaxZ += tDz;
    }
  }

  return { hit: false };
}
