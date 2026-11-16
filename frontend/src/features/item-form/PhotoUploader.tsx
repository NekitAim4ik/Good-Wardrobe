import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { uploadPhoto } from '../../entities/item/api'
import { ITEM_LIMITS, PHOTO_RULES } from '../../entities/item/model'

export interface Photo {
  id: string
  name: string
  uploading: boolean
  key?: string 
  url?: string
}

interface Props {
  photos: Photo[]
  setPhotos: Dispatch<SetStateAction<Photo[]>>
  error?: string
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
const MAX_MB = PHOTO_RULES.maxBytes / 1024 / 1024

export function PhotoUploader({ photos, setPhotos, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [note, setNote] = useState('')

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setNote('')
    const free = ITEM_LIMITS.photosMax - photos.length
    const problems: string[] = []
    if (files.length > free) problems.push(`Можно добавить не больше ${ITEM_LIMITS.photosMax} фотографий.`)

    for (const file of Array.from(files).slice(0, Math.max(free, 0))) {
      if (!(PHOTO_RULES.mimeTypes as readonly string[]).includes(file.type)) {
        problems.push(`«${file.name}»: допустимы только JPEG, PNG и WebP.`)
        continue
      }
      if (file.size > PHOTO_RULES.maxBytes) {
        problems.push(`«${file.name}»: файл больше ${MAX_MB} МБ.`)
        continue
      }
      const id = newId()
      setPhotos((p) => [...p, { id, name: file.name, uploading: true }])
      uploadPhoto(file)
        .then((r) => setPhotos((p) => p.map((x) => (x.id === id ? { ...x, uploading: false, key: r.key, url: r.url } : x))))
        .catch((err) => {
          setPhotos((p) => p.filter((x) => x.id !== id))
          setNote(`«${file.name}»: ${err instanceof Error ? err.message : 'не удалось загрузить.'}`)
        })
    }
    if (problems.length) setNote(problems.join(' '))
  }

  const remove = (id: string) => setPhotos((p) => p.filter((x) => x.id !== id))
  const makeCover = (id: string) =>
    setPhotos((p) => {
      const item = p.find((x) => x.id === id)
      return item ? [item, ...p.filter((x) => x.id !== id)] : p
    })

  return (
    <div className="field">
      <span className="field__label">Фотографии</span>
      <ul className="photos">
        {photos.map((p, i) => (
          <li key={p.id} className="photos__tile">
            {p.uploading || !p.url ? (
              <span className="photos__loading" role="status">Загрузка…</span>
            ) : (
              <>
                <img src={p.url} alt={`Фото ${i + 1}`} />
                {i === 0 && <span className="photos__cover">Обложка</span>}
                <div className="photos__tools">
                  {i > 0 && (
                    <button type="button" onClick={() => makeCover(p.id)} aria-label={`Сделать фото ${i + 1} обложкой`}>★</button>
                  )}
                  <button type="button" onClick={() => remove(p.id)} aria-label={`Удалить фото ${i + 1}`}>✕</button>
                </div>
              </>
            )}
          </li>
        ))}
        {photos.length < ITEM_LIMITS.photosMax && (
          <li>
            <button type="button" name="photos" className="photos__add" onClick={() => inputRef.current?.click()}>
              + Добавить фото
            </button>
          </li>
        )}
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_RULES.mimeTypes.join(',')}
        multiple
        hidden
        onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
      />
      <div className="field__hint">
        До {ITEM_LIMITS.photosMax} фотографий (JPEG, PNG или WebP, до {MAX_MB} МБ). Первая станет обложкой.
      </div>
      {note && <div className="field__err" role="alert">{note}</div>}
      {error && <div className="field__err" role="alert">{error}</div>}
    </div>
  )
}
