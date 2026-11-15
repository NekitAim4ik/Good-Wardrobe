import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Throttle } from '@nestjs/throttler'
import { PHOTO_RULES } from '../items/items.constants'
import { UploadedImage } from './uploads.types'
import { UploadsService } from './uploads.service'

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: PHOTO_RULES.maxBytes, files: 1 } }))
  upload(@UploadedFile() file: UploadedImage | undefined) {
    if (!file) throw new BadRequestException('Выберите файл — поле "file".')
    return this.uploads.saveImage(file.buffer)
  }
}
