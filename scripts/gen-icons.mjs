// Generates the PWA icons (a soccer ball on a pitch-green field) as PNGs
// with no image-library dependency — pixels are computed directly and
// encoded with Node's built-in zlib.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

function png(size, pixelFn) {
  const raw = Buffer.alloc(size * (1 + size * 4))
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelFn(x, y)
      raw[o++] = r
      raw[o++] = g
      raw[o++] = b
      raw[o++] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function inPentagon(px, py, cx, cy, r) {
  const pts = []
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  let inside = false
  for (let i = 0, j = 4; i < 5; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const BG = [244, 238, 221]
const BALL = [26, 71, 42]
const PATCH = [244, 238, 221]

function makeIcon(size, ballRatio) {
  const c = size / 2
  const ballR = size * ballRatio
  const pentR = ballR * 0.45
  const SS = 3 // supersampling grid per pixel
  return png(size, (x, y) => {
    let r = 0
    let g = 0
    let b = 0
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const px = x + (sx + 0.5) / SS
        const py = y + (sy + 0.5) / SS
        const d = Math.hypot(px - c, py - c)
        let col = BG
        if (d <= ballR) col = inPentagon(px, py, c, c, pentR) ? PATCH : BALL
        r += col[0]
        g += col[1]
        b += col[2]
      }
    }
    const n = SS * SS
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]
  })
}

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'icon-192.png'), makeIcon(192, 0.34))
writeFileSync(join(OUT, 'icon-512.png'), makeIcon(512, 0.34))
// Maskable: content must fit the 40%-radius safe zone after masking.
writeFileSync(join(OUT, 'maskable-512.png'), makeIcon(512, 0.26))
console.log('icons written to', OUT)
