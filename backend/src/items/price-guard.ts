const PRICE_PATTERN = /\d\s*(?:₽|\$|€|usd|eur|руб(?:л|(?![а-яё])))|(?:₽|\$|€)\s*\d/i

export const containsPrice = (text?: string | null): boolean => !!text && PRICE_PATTERN.test(text)
