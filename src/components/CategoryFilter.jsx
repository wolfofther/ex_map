import { CATEGORIES } from '../data/categories'

export default function CategoryFilter({ visibleCategoryIds, onToggle }) {
  return (
    <div className="category-filter">
      {CATEGORIES.map((cat) => {
        const selected = visibleCategoryIds.has(cat.id)
        return (
          <button
            key={cat.id}
            className={`chip${selected ? ' selected' : ''}`}
            style={selected ? { background: cat.color } : undefined}
            onClick={() => onToggle(cat.id)}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        )
      })}
    </div>
  )
}
