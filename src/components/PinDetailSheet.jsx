import { getCategory } from '../data/categories'

export default function PinDetailSheet({ pin, alreadyEmpathized, onClose, onEmpathize }) {
  const category = getCategory(pin.category)
  const createdAt = pin.created_at ? new Date(pin.created_at) : null

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <span
          className="chip selected"
          style={{ background: category.color, display: 'inline-flex', marginBottom: 14 }}
        >
          <span>{category.emoji}</span>
          <span>{category.label}</span>
        </span>

        <h2 className="sheet-title" style={{ fontSize: 22, lineHeight: 1.4 }}>
          “{pin.text}”
        </h2>
        {createdAt && (
          <p className="sheet-sub">
            {createdAt.toLocaleDateString('ko-KR')} · 이 자리를 지나던 누군가의 기억
          </p>
        )}

        <button
          className="sheet-submit"
          style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          disabled={alreadyEmpathized}
          onClick={onEmpathize}
        >
          {alreadyEmpathized ? '💛 공감했습니다' : '💛 나도 여기서 후회했어요'}
          <span style={{ opacity: 0.7 }}>· {pin.empathy_count ?? 0}</span>
        </button>
      </div>
    </div>
  )
}
