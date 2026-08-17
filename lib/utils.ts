export function formatPrice(price?: number) {
  if (!price) return "Check price";
  return `From $${price}`;
}
