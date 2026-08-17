import { useMemo } from 'react'

// 좌표를 대략 120m 격자로 반올림해 "같은 장소"로 묶습니다.
// (기획서 5장 "후회 명소 랭킹: 핀 수 + 공감 수 기준" 반영한 단순 클러스터링)
const GRID = 0.001

function gridKey(lat, lng) {
  return `${Math.round(lat / GRID) * GRID}_${Math.round(lng / GRID) * GRID}`
}

export default function RankingPanel({ pins, onClose, onSelectSpot }) {
  const spots = useMemo(() => {
    const map = new Map()
    pins.forEach((pin) => {
      const key = gridKey(pin.lat, pin.lng)
      if (!map.has(key)) {
        map.set(key, { key, lat: pin.lat, lng: pin.lng, pinCount: 0, empathySum: 0 })
      }
      const spot = map.get(key)
      spot.pinCount += 1
      spot.empathySum += pin.empathy_count ?? 0
    })
    return Array.from(map.values())
      .sort((a, b) => (b.pinCount + b.empathySum) - (a.pinCount + a.empathySum))
      .slice(0, 10)
  }, [pins])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet ranking-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">🏆 전국 후회 명소 TOP 10</h2>
        <p className="sheet-sub">핀 수와 공감 수를 합산한 순위입니다.</p>

        {spots.length === 0 ? (
          <div className="empty-state">아직 형성된 후회 명소가 없습니다.<br />첫 번째 핀을 꽂아보십시오.</div>
        ) : (
          spots.map((spot, i) => (
            <div key={spot.key} className="rank-row" onClick={() => onSelectSpot(spot)}>
              <span className={`rank-num${i < 3 ? ' top' : ''}`}>{i + 1}</span>
              <div className="rank-info">
                <div className="rank-place">
                  {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}
                </div>
                <div className="rank-stat">핀 {spot.pinCount}개 · 공감 {spot.empathySum}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
