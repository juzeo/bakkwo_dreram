'use client'

import Link from 'next/link'
import { Leaf, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/useAuth'

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Leaf className="size-4" />
      </span>
      <span>바꿔드림 <span className="text-primary">Dream</span></span>
    </Link>
  )
}

export function GNB() {
  const { email, logout } = useAuth()
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          <Link className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground" href="/label-maker">
            메뉴 자율 영양표시
          </Link>
          <Link className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground" href="/remodeler">
            클린 레시피 리모델러
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/storage" />} variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex">내 보관함</Button>
          {email ? (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex"><User className="size-4" />{email}</span>
              <Button variant="outline" size="sm" className="rounded-full px-4" onClick={logout}><LogOut data-icon="inline-start" />로그아웃</Button>
            </div>
          ) : (
            <Button render={<Link href="/login" />} size="sm" className="rounded-full px-4">로그인</Button>
          )}
        </div>
      </div>
    </header>
  )
}
