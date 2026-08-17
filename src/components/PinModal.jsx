import { useState } from 'react'
import { CATEGORIES } from '../data/categories'

const MAX_LEN = 50

export default function PinModal({ position, onCancel, onSubmit, submitting }) {
  const [category, setCategory] = useState(null)
  const [text, setText] = useState('')

  const canSubmit = category && text.trim().length > 0 && !submitting

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">이 자리, 후회를 남기시겠습니까</h2>
        <p className="sheet-sub">핀은 익명으로 등록되며, 등록 후 수정할 수 없습니다.</p>

        <div className="location-hint">
          📍 <strong>{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</strong>
        </div>

        <div className="field-label">카테고리</div>
        <div className="category-picker">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`category-option${category === cat.id ? ' selected' : ''}`}
              style={category === cat.id ? { color: cat.color } : undefined}
              onClick={() => setCategory(cat.id)}
            >
              <span className="emoji">{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="field-label">한 줄 후회</div>
        <textarea
          className="regret-input"
          placeholder="예: 친구 말 듣지 말걸 ㅋ"
          maxLength={MAX_LEN}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="char-count">{text.length} / {MAX_LEN}</div>

        <button
          className="sheet-submit"
          disabled={!canSubmit}
          onClick={() => onSubmit({ category, text: text.trim() })}
        >
          {submitting ? '등록 중…' : '이 자리에 핀 꽂기'}
        </button>
      </div>
    </div>
  )
}
