import * as THREE from 'three';
import { CHUNK_SIZE } from '../world/Chunk.js';
import { BLOCKS, BLOCK_DATA } from '../world/BlockRegistry.js';

const FACES = [
  { dir: [ 1, 0, 0], corners: [[1,0,1],[1,1,1],[1,1,0],[1,0,0]], normal: [ 1, 0, 0] },
  { dir: [-1, 0, 0], corners: [[0,0,0],[0,1,0],[0,1,1],[0,0,1]], normal: [-1, 0, 0] },
  { dir: [ 0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], normal: [ 0, 1, 0] },
  { dir: [ 0,-1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], normal: [ 0,-1, 0] },
  { dir: [ 0, 0, 1], corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], normal: [ 0, 0, 1] },
  { dir: [ 0, 0,-1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], normal: [ 0, 0,-1] },
];

export function buildChunkMesh(chunk, getBlock) {
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];
  let vi = 0;

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const block = chunk.getBlock(lx, ly, lz);
        if (block === BLOCKS.AIR) continue;

        const data = BLOCK_DATA[block];
        const r = ((data.color >> 16) & 0xff) / 255;
        const g = ((data.color >>  8) & 0xff) / 255;
        const b = ( data.color        & 0xff) / 255;
        const wx = chunk.cx * CHUNK_SIZE + lx;
        const wy = chunk.cy * CHUNK_SIZE + ly;
        const wz = chunk.cz * CHUNK_SIZE + lz;

        for (const face of FACES) {
          const neighborBlock = getBlock(
            wx + face.dir[0],
            wy + face.dir[1],
            wz + face.dir[2]
          );
          const neighborData = BLOCK_DATA[neighborBlock];
          if (neighborData && neighborData.solid) continue;

          for (const corner of face.corners) {
            positions.push(lx + corner[0], ly + corner[1], lz + corner[2]);
            normals.push(...face.normal);
            const shade = face.dir[1] === -1 ? 0.6 : face.dir[1] === 1 ? 1.0 : 0.85;
            colors.push(r * shade, g * shade, b * shade);
          }
          indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
          vi += 4;
        }
      }
    }
  }

  if (positions.length === 0) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors,    3));
  geo.setIndex(indices);

  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(
    chunk.cx * CHUNK_SIZE,
    chunk.cy * CHUNK_SIZE,
    chunk.cz * CHUNK_SIZE
  );
  return mesh;
}
