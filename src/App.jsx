import { useCallback, useEffect, useMemo, useState } from 'react'
import MapView from './components/MapView'
import CategoryFilter from './components/CategoryFilter'
import PinModal from './components/PinModal'
import PinDetailSheet from './components/PinDetailSheet'
import RankingPanel from './components/RankingPanel'
import { CATEGORIES } from './data/categories'
import { getDeviceId, isSupabaseConfigured } from './supabaseClient'
import { fetchPins, fetchMyEmpathyIds, insertPin, insertEmpathy } from './lib/pinsRepo'

export default function App() {
  const deviceId = useMemo(() => getDeviceId(), [])

  const [pins, setPins] = useState([])
  const [empathizedIds, setEmpathizedIds] = useState(new Set())
  const [visibleCategoryIds, setVisibleCategoryIds] = useState(
    new Set(CATEGORIES.map((c) => c.id))
  )

  const [placingMode, setPlacingMode] = useState(false)
  const [pendingPosition, setPendingPosition] = useState(null) // 핀 등록 중인 좌표
  const [submitting, setSubmitting] = useState(false)

  const [selectedPin, setSelectedPin] = useState(null)
  const [showRanking, setShowRanking] = useState(false)
  const [toast, setToast] = useState(null)

  const flashToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    if (!isSupabaseConfigured) {
      flashToast('⚠️ Supabase 미설정 — 로컬(이 브라우저)에만 저장됩니다')
    }
    ;(async () => {
      const { data: pinRows, error } = await fetchPins()
      if (!error && pinRows) setPins(pinRows)

      const { data: myEmpathies } = await fetchMyEmpathyIds(deviceId)
      if (myEmpathies) setEmpathizedIds(new Set(myEmpathies.map((e) => e.pin_id)))
    })()
  }, [deviceId, flashToast])

  const toggleCategory = useCallback((id) => {
    setVisibleCategoryIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      // 전부 해제되는 것은 UX상 무의미하므로 최소 1개는 유지
      return next.size === 0 ? prev : next
    })
  }, [])

  const startPlacing = () => {
    setPlacingMode(true)
    flashToast('지도를 눌러 후회의 장소를 선택하십시오')
  }

  const handleMapClick = useCallback((position) => {
    setPendingPosition(position)
    setPlacingMode(false)
  }, [])

  const handleSubmitPin = async ({ category, text }) => {
    setSubmitting(true)
    const { data, error } = await insertPin({
      lat: pendingPosition.lat,
      lng: pendingPosition.lng,
      category,
      text,
      device_id: deviceId
    })
    setSubmitting(false)

    if (error) {
      flashToast('등록에 실패했습니다. 잠시 후 다시 시도하십시오')
      return
    }
    setPins((prev) => [data, ...prev])
    setPendingPosition(null)
    flashToast('핀이 등록되었습니다')
  }

  const handleEmpathize = async () => {
    if (!selectedPin || empathizedIds.has(selectedPin.id)) return
    const { error } = await insertEmpathy({ pin_id: selectedPin.id, device_id: deviceId })

    if (error) {
      // unique 제약 위반(이미 공감) 등은 조용히 상태만 동기화
      setEmpathizedIds((prev) => new Set(prev).add(selectedPin.id))
      return
    }
    setEmpathizedIds((prev) => new Set(prev).add(selectedPin.id))
    setPins((prev) =>
      prev.map((p) =>
        p.id === selectedPin.id ? { ...p, empathy_count: (p.empathy_count ?? 0) + 1 } : p
      )
    )
    setSelectedPin((prev) => ({ ...prev, empathy_count: (prev.empathy_count ?? 0) + 1 }))
  }

  return (
    <div className="app-shell">
      <MapView
        pins={pins}
        visibleCategoryIds={visibleCategoryIds}
        placingMode={placingMode}
        onMapClick={handleMapClick}
        onPinClick={setSelectedPin}
      />

      <header className="app-header">
        <div className="wordmark">
          🗺️ 후회 지도<span className="dot">●</span>
        </div>
        <div className="header-actions">
          <button
            className={`icon-btn${showRanking ? ' active' : ''}`}
            onClick={() => setShowRanking(true)}
            aria-label="후회 명소 랭킹"
          >
            🏆
          </button>
        </div>
      </header>

      <CategoryFilter visibleCategoryIds={visibleCategoryIds} onToggle={toggleCategory} />

      <div className="bottom-bar">
        <button
          className="primary-cta"
          onClick={startPlacing}
          disabled={placingMode}
        >
          {placingMode ? '지도를 눌러주십시오 ↑' : '📍 후회 핀 꽂기'}
        </button>
        {placingMode && (
          <button className="secondary-cta" onClick={() => setPlacingMode(false)} aria-label="취소">
            ✕
          </button>
        )}
      </div>

      {pendingPosition && (
        <PinModal
          position={pendingPosition}
          submitting={submitting}
          onCancel={() => setPendingPosition(null)}
          onSubmit={handleSubmitPin}
        />
      )}

      {selectedPin && (
        <PinDetailSheet
          pin={selectedPin}
          alreadyEmpathized={empathizedIds.has(selectedPin.id)}
          onClose={() => setSelectedPin(null)}
          onEmpathize={handleEmpathize}
        />
      )}

      {showRanking && (
        <RankingPanel
          pins={pins}
          onClose={() => setShowRanking(false)}
          onSelectSpot={() => setShowRanking(false)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
