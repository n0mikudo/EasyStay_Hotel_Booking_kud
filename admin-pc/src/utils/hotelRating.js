export function getHotelRatingLabel(rating) {
  const num = Number(rating);
  if (num === 2) return '经济型';
  if (num === 3) return '舒适型';
  if (num === 4) return '高档型';
  if (num === 5) return '豪华型';
  return '未设置';
}
