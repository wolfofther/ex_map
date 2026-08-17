// 구글맵 JS SDK를 1회만 동적으로 로드하는 헬퍼.
let loadPromise = null

export function loadGoogleMaps() {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps)
      return
    }

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!key || key.includes('여기에')) {
      reject(
        new Error(
          '구글맵 API 키가 설정되지 않았습니다. .env 파일의 VITE_GOOGLE_MAPS_API_KEY 를 확인하십시오.'
        )
      )
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=marker,visualization&loading=async&callback=__initGoogleMaps`
    script.async = true
    script.defer = true

    window.__initGoogleMaps = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('구글맵 스크립트 로드 실패 (네트워크 또는 키 오류)'))

    document.head.appendChild(script)
  })

  return loadPromise
}
