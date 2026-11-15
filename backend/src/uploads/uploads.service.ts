import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomBytes } from 'crypto'
import { access, mkdir, writeFile } from 'fs/promises'
import { join, resolve } from 'path'
import { Env } from '../config/env'
import { PHOTO_KEY_PATTERN } from '../items/items.constants'

const URL_PREFIX = '/api/uploads/'

function detectImageExtension(b: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (b.length < 12) return null
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg'
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return null
}

@Injectable()
export class UploadsService implements OnModuleInit {
  readonly directory: string

  constructor(config: ConfigService<Env, true>) {
    this.directory = resolve(config.get('UPLOADS_DIR', { infer: true }))
  }

  async onModuleInit() {
    await mkdir(this.directory, { recursive: true })
  }

  async saveImage(buffer: Buffer): Promise<{ key: string; url: string }> {
    const ext = detectImageExtension(buffer)
    if (!ext) throw new BadRequestException('Допустимы только изображения JPEG, PNG или WebP.')
    const key = `${randomBytes(16).toString('hex')}.${ext}`
    await writeFile(join(this.directory, key), buffer, { flag: 'wx' })
    return { key, url: this.urlFor(key) }
  }

  urlFor(key: string) {
    return URL_PREFIX + key
  }

  keyFromUrl(url: string) {
    return url.startsWith(URL_PREFIX) ? url.slice(URL_PREFIX.length) : url
  }

  async missingKeys(keys: string[]): Promise<string[]> {
    const missing: string[] = []
    for (const key of keys) {
      if (!PHOTO_KEY_PATTERN.test(key)) {
        missing.push(key)
        continue
      }
      try {
        await access(join(this.directory, key))
      } catch {
        missing.push(key)
      }
    }
    return missing
  }
}
