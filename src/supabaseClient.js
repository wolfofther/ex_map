import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const FALLBACK_URL = 'https://placeholder.supabase.co'
const FALLBACK_KEY = 'placeholder-anon-key'

function isValidHttpUrl(value) {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const usingFallback = !rawUrl || !rawKey || !isValidHttpUrl(rawUrl)

if (usingFallback) {
  // .env 값이 비어있거나(안내 문구가 그대로 남아있는 경우 포함) 유효한 URL이 아니면
  // 실제 Supabase 대신 더미 클라이언트로 대체합니다.
  // 이렇게 하지 않으면 createClient()가 잘못된 URL로 즉시 예외를 던져
  // 화면 전체가 빈 흰 화면으로 보이게 됩니다 (React가 아예 마운트되지 못함).
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] .env 의 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 아직 실제 값으로 채워지지 않았습니다. ' +
      '지도/핀 UI는 뜨지만 저장은 되지 않습니다. supabase/schema.sql 실행 후 실제 값을 채워 넣으십시오.'
  )
}

export const supabase = createClient(
  isValidHttpUrl(rawUrl) ? rawUrl : FALLBACK_URL,
  rawKey || FALLBACK_KEY
)
export const isSupabaseConfigured = !usingFallback

// 비회원 UUID 발급 및 로컬 보관 (기획서 5장 "익명성: 비회원 UUID 기반" 반영)
const DEVICE_ID_KEY = 'regret_map_device_id'

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

