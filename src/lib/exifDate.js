// Minimal JPEG EXIF DateTimeOriginal reader. Returns ms timestamp or null.
// We only parse the first 64KB which covers the APP1/EXIF segment in normal files.

export async function readPhotoTakenAt(file) {
  // Best signal first: JPEG EXIF DateTimeOriginal.
  if (/jpe?g$/i.test(file.type) || /\.jpe?g$/i.test(file.name)) {
    try {
      const exif = await readJpegExif(file)
      if (exif) return { ts: exif, source: 'exif' }
    } catch {}
  }
  // Fallback: filesystem lastModified (less trustworthy — user can re-save a file).
  if (file.lastModified) return { ts: file.lastModified, source: 'mtime' }
  return { ts: null, source: 'unknown' }
}

async function readJpegExif(file) {
  const buf = await file.slice(0, 65536).arrayBuffer()
  const view = new DataView(buf)
  if (view.getUint16(0) !== 0xFFD8) return null
  let offset = 2
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset)
    if (marker === 0xFFE1) {
      const size = view.getUint16(offset + 2)
      // "Exif\0\0" at offset+4
      if (view.getUint32(offset + 4) === 0x45786966) {
        return parseExifSegment(view, offset + 10)
      }
      offset += 2 + size
    } else if ((marker & 0xFF00) === 0xFF00) {
      const size = view.getUint16(offset + 2)
      offset += 2 + size
    } else return null
  }
  return null
}

function parseExifSegment(view, tiffStart) {
  const little = view.getUint16(tiffStart) === 0x4949
  const u16 = o => view.getUint16(o, little)
  const u32 = o => view.getUint32(o, little)
  if (u16(tiffStart + 2) !== 0x002A) return null
  const ifd0 = tiffStart + u32(tiffStart + 4)
  let exifIfdOff = null
  const ifd0Count = u16(ifd0)
  for (let i = 0; i < ifd0Count; i++) {
    const e = ifd0 + 2 + i * 12
    if (u16(e) === 0x8769) { exifIfdOff = tiffStart + u32(e + 8); break }
  }
  if (!exifIfdOff) return null
  const exifCount = u16(exifIfdOff)
  for (let i = 0; i < exifCount; i++) {
    const e = exifIfdOff + 2 + i * 12
    if (u16(e) === 0x9003) {
      const count = u32(e + 4)
      const valOff = count > 4 ? tiffStart + u32(e + 8) : e + 8
      let s = ''
      for (let j = 0; j < count - 1; j++) s += String.fromCharCode(view.getUint8(valOff + j))
      const m = s.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)
      if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime()
    }
  }
  return null
}

// Used by the pump-pic flow. Returns { ok, ts, reason } where reason is a
// funny rejection message when the photo isn't recent enough.
import { funnyOldPhotoReject } from './funnyRejects.js'

const RECENT_MS = 2 * 60 * 60 * 1000 // 2-hour window

export async function checkPhotoIsRecent(file) {
  const { ts, source } = await readPhotoTakenAt(file)
  if (!ts) {
    return { ok: false, ts: null, source, reason: "Can't read this photo's metadata. Take a fresh one with the camera." }
  }
  const age = Date.now() - ts
  if (age > RECENT_MS) {
    return { ok: false, ts, source, reason: funnyOldPhotoReject(age) }
  }
  return { ok: true, ts, source }
}
