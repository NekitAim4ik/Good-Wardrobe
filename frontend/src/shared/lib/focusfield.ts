export function focusField(form: HTMLFormElement, name: string) {
  const el = form.elements.namedItem(name)
  if (el instanceof HTMLElement) el.focus()
}