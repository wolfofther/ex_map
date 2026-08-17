// Supabase가 설정되어 있으면 실제 서버(Supabase)를 쓰고,
// 설정되어 있지 않으면 브라우저 localStorage로 자동 대체합니다.
// (Supabase 설정 전에도 핀 등록/공감 UX를 바로 테스트할 수 있게 하기 위함)
import { supabase, isSupabaseConfigured } from '../supabaseClient'

const LOCAL_PINS_KEY = 'regretmap_local_pins'
const LOCAL_EMPATHY_KEY = 'regretmap_local_empathies'

function readLocalPins() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PINS_KEY) || '[]')
  } catch {
    return []
  }
}
function writeLocalPins(pins) {
  localStorage.setItem(LOCAL_PINS_KEY, JSON.stringify(pins))
}
function readLocalEmpathies() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_EMPATHY_KEY) || '[]')
  } catch {
    return []
  }
}
function writeLocalEmpathies(list) {
  localStorage.setItem(LOCAL_EMPATHY_KEY, JSON.stringify(list))
}

export async function fetchPins() {
  if (!isSupabaseConfigured) {
    return { data: readLocalPins().sort((a, b) => (a.created_at < b.created_at ? 1 : -1)), error: null }
  }
  return supabase.from('pins').select('*').order('created_at', { ascending: false }).limit(2000)
}

export async function fetchMyEmpathyIds(deviceId) {
  if (!isSupabaseConfigured) {
    const mine = readLocalEmpathies()
      .filter((e) => e.device_id === deviceId)
      .map((e) => e.pin_id)
    return { data: mine.map((pin_id) => ({ pin_id })), error: null }
  }
  return supabase.from('pin_empathies').select('pin_id').eq('device_id', deviceId)
}

export async function insertPin({ lat, lng, category, text, device_id }) {
  if (!isSupabaseConfigured) {
    const newPin = {
      id: crypto.randomUUID(),
      lat,
      lng,
      category,
      text,
      empathy_count: 0,
      device_id,
      created_at: new Date().toISOString()
    }
    const pins = readLocalPins()
    pins.unshift(newPin)
    writeLocalPins(pins)
    return { data: newPin, error: null }
  }
  return supabase
    .from('pins')
    .insert({ lat, lng, category, text, device_id })
    .select()
    .single()
}

export async function insertEmpathy({ pin_id, device_id }) {
  if (!isSupabaseConfigured) {
    const empathies = readLocalEmpathies()
    if (empathies.some((e) => e.pin_id === pin_id && e.device_id === device_id)) {
      return { error: { message: 'already empathized' } }
    }
    empathies.push({ pin_id, device_id })
    writeLocalEmpathies(empathies)
    const pins = readLocalPins().map((p) =>
      p.id === pin_id ? { ...p, empathy_count: (p.empathy_count ?? 0) + 1 } : p
    )
    writeLocalPins(pins)
    return { error: null }
  }
  return supabase.from('pin_empathies').insert({ pin_id, device_id })
}
