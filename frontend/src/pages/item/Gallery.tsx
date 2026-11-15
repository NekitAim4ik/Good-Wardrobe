import { useState } from 'react'

export function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState(0)

  if (photos.length === 0) return <div className="gallery__ph">Фотографий нет</div>

  return (
    <div className="gallery">
      <img className="gallery__main" src={photos[Math.min(index, photos.length - 1)]} alt={title} />
      {photos.length > 1 && (
        <div className="gallery__thumbs" role="group" aria-label="Фотографии вещи">
          {photos.map((url, i) => (
            <button
              key={url}
              type="button"
              className="gallery__thumb"
              aria-label={`Фото ${i + 1} из ${photos.length}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => setIndex(i)}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
