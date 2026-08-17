import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../lib/loadGoogleMaps'
import { getCategory } from '../data/categories'

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 } // 서울시청 기본값

// 야간 지도 스타일 — "가로등처럼 빛나는 핀"이 돋보이도록 지도 자체는 어둡게.
const NIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0f1626' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0f1c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#63708a' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1c2740' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#182238' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f1626' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#22304d' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#060a13' }] }
]

export default function MapView({
  pins,
  visibleCategoryIds,
  placingMode,
  onMapClick,
  onPinClick
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map())
  const clickListenerRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return
        mapRef.current = new maps.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: NIGHT_MAP_STYLE
        })
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMsg(err.message)
        setStatus('error')
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !window.google) return
    const maps = window.google.maps
    if (clickListenerRef.current) {
      maps.event.removeListener(clickListenerRef.current)
      clickListenerRef.current = null
    }
    if (placingMode) {
      clickListenerRef.current = mapRef.current.addListener('click', (e) => {
        onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() })
      })
    }
    return () => {
      if (clickListenerRef.current) {
        maps.event.removeListener(clickListenerRef.current)
      }
    }
  }, [status, placingMode, onMapClick])

  useEffect(() => {
    if (status !== 'ready' || !window.google) return
    const maps = window.google.maps
    const currentIds = new Set(pins.map((p) => p.id))

    for (const [id, marker] of markersRef.current.entries()) {
      if (!currentIds.has(id)) {
        marker.setMap(null)
        markersRef.current.delete(id)
      }
    }

    pins.forEach((pin) => {
      const category = getCategory(pin.category)
      const visible = visibleCategoryIds.has(pin.category)
      let marker = markersRef.current.get(pin.id)

      if (!marker) {
        const el = document.createElement('div')
        el.className = 'regret-pin'
        el.style.color = category.color
        el.style.background = category.color

        marker = new maps.marker.AdvancedMarkerElement
          ? new maps.marker.AdvancedMarkerElement({ position: pin, content: el })
          : new maps.Marker({
              position: pin,
              icon: {
                path: maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: category.color,
                fillOpacity: 1,
                strokeColor: '#0a0f1c',
                strokeWeight: 2
              }
            })
        marker.addListener('click', () => onPinClick(pin))
        markersRef.current.set(pin.id, marker)
      }

      marker.map = visible ? mapRef.current : null
      if (marker.setMap) marker.setMap(visible ? mapRef.current : null)
    })
  }, [pins, visibleCategoryIds, status, onPinClick])

  return (
    <div className="map-canvas">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {status === 'loading' && (
        <div className="map-loading">지도를 불러오는 중…</div>
      )}
      {status === 'error' && (
        <div className="map-error">
          <strong>지도를 불러오지 못했습니다</strong>
          <span>{errorMsg}</span>
          <span>
            <code>.env</code> 파일의 <code>VITE_GOOGLE_MAPS_API_KEY</code> 값을 확인하십시오.
          </span>
        </div>
      )}
    </div>
  )
}
