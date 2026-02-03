export function sumLineItems(items = []) {
  return items.reduce((total, item) => total + Number(item?.total || 0), 0)
}
