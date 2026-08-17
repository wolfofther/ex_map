// 후회 카테고리 정의 — 색상은 지도 위 핀 색상 및 UI 강조색으로 사용됩니다.
export const CATEGORIES = [
  { id: 'money', label: '돈/투자', emoji: '💰', color: '#F5A524' },
  { id: 'love', label: '사랑', emoji: '💕', color: '#F4478A' },
  { id: 'career', label: '커리어', emoji: '💼', color: '#4C9AFF' },
  { id: 'daily', label: '일상', emoji: '🍚', color: '#4ADE80' },
  { id: 'etc', label: '기타', emoji: '🌫️', color: '#A78BFA' }
]

export const getCategory = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
