import { useEffect, useState } from 'react'

// TODO: 구글 로그인(NextAuth)으로 교체 예정 — 그 전까지 로컬 세션으로 동작.
// 교체 시 이 파일만 NextAuth의 useSession()/signIn('google')/signOut()으로 바꾸면
// GNB, LoginPage 등 이 훅을 쓰는 컴포넌트는 수정할 필요가 없습니다.
const AUTH_KEY = 'nutridoctor:auth'

export function useAuth() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_KEY)
      if (raw) setEmail(JSON.parse(raw).email)
    } catch {}
  }, [])

  const login = (nextEmail: string) => {
    try { window.localStorage.setItem(AUTH_KEY, JSON.stringify({ email: nextEmail })) } catch {}
    setEmail(nextEmail)
  }

  const logout = () => {
    try { window.localStorage.removeItem(AUTH_KEY) } catch {}
    setEmail(null)
  }

  return { email, login, logout }
}
