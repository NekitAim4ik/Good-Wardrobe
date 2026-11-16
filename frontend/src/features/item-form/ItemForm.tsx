import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Category, City } from '../../entities/catalog/model'
import { createItem } from '../../entities/item/api'
import {
  conditionLabels, formatLabels, ITEM_LIMITS as L,
  type ItemCondition, type TransferFormat,
} from '../../entities/item/model'
import { ApiError } from '../../shared/api/apierror'
import { focusField } from '../../shared/lib/focusfield'
import { Button } from '../../shared/ui/Button'
import { TextField } from '../../shared/ui/TextField'
import { PhotoUploader, type Photo } from './PhotoUploader'
import {
  FIELD_ORDER, parseWeight, validateItem, type ItemFormErrors, type ItemFormValues,
} from './validation'

const SERVER_FIELDS: Record<string, string> = { photoKeys: 'photos', weightKg: 'weight' }

export function ItemForm({ categories, cities }: { categories: Category[]; cities: City[] }) {
  const navigate = useNavigate()
  const categoryId = useId()
  const descriptionId = useId()
  const districtId = useId()

  const [values, setValues] = useState<ItemFormValues>({
    title: '', categoryId: '', condition: 'good', transferFormat: 'gift', wantedInReturn: '',
    description: '', quantity: '1', weight: '', districtId: '', meetingNote: '',
  })
  const [photos, setPhotos] = useState<Photo[]>([])
  const [errors, setErrors] = useState<ItemFormErrors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const category = categories.find((c) => String(c.id) === values.categoryId)
  const set = <K extends keyof ItemFormValues>(key: K, value: ItemFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setFormError('')

    const ready = photos.filter((p) => p.key)
    const errs = validateItem(values, { ready: ready.length, uploading: photos.some((p) => p.uploading) }, category)
    setErrors(errs)
    const first = FIELD_ORDER.find((k) => errs[k])
    if (first) return focusField(form, first)

    const weight = parseWeight(values.weight)
    setBusy(true)
    try {
      const item = await createItem({
        title: values.title.trim(),
        description: values.description.trim(),
        categoryId: Number(values.categoryId),
        condition: values.condition,
        transferFormat: values.transferFormat,
        wantedInReturn: values.transferFormat === 'exchange' ? values.wantedInReturn.trim() : undefined,
        quantity: Number(values.quantity),
        weightKg: weight ?? undefined,
        districtId: Number(values.districtId),
        meetingNote: values.meetingNote.trim() || undefined,
        photoKeys: ready.map((p) => p.key!),
      })
      navigate(`/items/${item.id}`)
    } catch (err) {
      const field = err instanceof ApiError && err.field ? (SERVER_FIELDS[err.field] ?? err.field) : null
      if (field && (FIELD_ORDER as readonly string[]).includes(field)) {
        setErrors({ [field]: (err as ApiError).message } as ItemFormErrors)
        focusField(form, field)
      } else {
        setFormError(err instanceof Error ? err.message : 'Не удалось опубликовать объявление. Попробуйте ещё раз.')
      }
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {formError && <div className="alert alert--bad" role="alert">{formError}</div>}

      <PhotoUploader photos={photos} setPhotos={setPhotos} error={errors.photos} />

      <TextField label="Название" name="title" maxLength={L.titleMax} placeholder="Например, детская зимняя куртка"
        value={values.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />

      <div className="field">
        <label htmlFor={categoryId}>Категория</label>
        <select id={categoryId} name="categoryId" value={values.categoryId}
          aria-invalid={errors.categoryId ? true : undefined}
          onChange={(e) => set('categoryId', e.target.value)}>
          <option value="">Выберите категорию</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {category?.examples && <div className="field__hint">Например: {category.examples}</div>}
        {errors.categoryId && <div className="field__err" role="alert">{errors.categoryId}</div>}
      </div>

      <fieldset className="fieldset">
        <legend>Состояние</legend>
        <div className="choices">
          {(Object.keys(conditionLabels) as ItemCondition[]).map((c) => (
            <label key={c} className="choice">
              <input type="radio" name="condition" value={c} checked={values.condition === c} onChange={() => set('condition', c)} />
              <span>{conditionLabels[c]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Как передать</legend>
        <div className="choices">
          {(Object.keys(formatLabels) as TransferFormat[]).map((f) => (
            <label key={f} className="choice">
              <input type="radio" name="transferFormat" value={f} checked={values.transferFormat === f} onChange={() => set('transferFormat', f)} />
              <span>{formatLabels[f]}</span>
            </label>
          ))}
        </div>
        <div className="field__hint">Только бесплатно: без цен и денежных условий.</div>
      </fieldset>

      {values.transferFormat === 'exchange' && (
        <TextField label="Что хотите получить взамен" name="wantedInReturn" maxLength={L.wantedMax}
          value={values.wantedInReturn} onChange={(e) => set('wantedInReturn', e.target.value)} error={errors.wantedInReturn} />
      )}

      <div className="field">
        <label htmlFor={descriptionId}>Описание</label>
        <textarea id={descriptionId} name="description" maxLength={L.descriptionMax}
          placeholder="Размер, цвет, чем пользовались, есть ли дефекты"
          value={values.description} aria-invalid={errors.description ? true : undefined}
          onChange={(e) => set('description', e.target.value)} />
        <div className="field__hint">{values.description.length} / {L.descriptionMax}</div>
        {errors.description && <div className="field__err" role="alert">{errors.description}</div>}
      </div>

      <div className="newitem__row">
        <TextField label="Количество, шт." name="quantity" type="number" min={1} max={L.quantityMax} inputMode="numeric"
          value={values.quantity} onChange={(e) => set('quantity', e.target.value)} error={errors.quantity} />
        <TextField label={category?.requiresWeight ? 'Вес, кг' : 'Вес, кг (необязательно)'} name="weight" inputMode="decimal"
          placeholder="1,5" hint={category?.requiresWeight ? 'Для этой категории вес обязателен.' : 'Если не знаете — оставьте пустым, посчитаем по категории.'}
          value={values.weight} onChange={(e) => set('weight', e.target.value)} error={errors.weight} />
      </div>

      <div className="field">
        <label htmlFor={districtId}>Район</label>
        <select id={districtId} name="districtId" value={values.districtId}
          aria-invalid={errors.districtId ? true : undefined}
          onChange={(e) => set('districtId', e.target.value)}>
          <option value="">Выберите район</option>
          {cities.map((c) => (
            <optgroup key={c.id} label={c.isTest ? `${c.name} (тестовый)` : c.name}>
              {c.districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </optgroup>
          ))}
        </select>
        {errors.districtId && <div className="field__err" role="alert">{errors.districtId}</div>}
      </div>

      <TextField label="Где встретиться (необязательно)" name="meetingNote" maxLength={L.meetingNoteMax}
        placeholder="Например, у метро или у подъезда"
        hint="Точный адрес и телефон не указывайте — детали согласуете в чате."
        value={values.meetingNote} onChange={(e) => set('meetingNote', e.target.value)} />

      <Button type="submit" className="btn--block" disabled={busy || photos.some((p) => p.uploading)}>
        {busy ? 'Публикуем…' : 'Опубликовать'}
      </Button>
    </form>
  )
}
