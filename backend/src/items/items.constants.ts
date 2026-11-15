export const ITEM_LIMITS = {
  titleMin: 3,
  titleMax: 100,
  descriptionMin: 10,
  descriptionMax: 2000,
  wantedMax: 300,
  meetingNoteMax: 300,
  quantityMax: 100,
  weightMaxKg: 1000,
  photosMin: 1,
  photosMax: 5,
} as const

export const PHOTO_RULES = {
  maxBytes: 5 * 1024 * 1024,
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const

export const PHOTO_KEY_PATTERN = /^[\w-]{8,64}\.(jpe?g|png|webp)$/i
