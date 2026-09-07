'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GNB } from '@/components/common/GNB'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/useAuth'

// NOTE: 구글 로그인(NextAuth)으로 교체 예정. 그 전까지 로컬 세션 placeholder로 동작합니다.
// 교체 시 이 폼을 걷어내고 <Button onClick={() => signIn('google')}>Google로 계속하기</Button> 로 바꾸면 됩니다.
export function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    login(email.trim())
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <GNB />
      <main className="mx-auto max-w-md px-5 py-16 lg:px-0">
        <div className="mb-10">
          <p className="text-sm font-medium text-primary">로그인</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">다시 오셨네요.</h1>
          <p className="mt-4 text-muted-foreground">저장한 레시피와 영양표시 기록을 이어서 관리하세요.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
          <label className="flex flex-col gap-2 text-sm font-medium">
            이메일
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="owner@restaurant.com" className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            비밀번호
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="mt-2 w-full">로그인 (임시)</Button>
          <p className="text-center text-xs text-muted-foreground">곧 Google 로그인으로 교체될 예정입니다.</p>
        </form>
      </main>
    </div>
  )
}
