'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import BrandMark from '@/components/ui/BrandMark'
import { cn } from '@/lib/utils'

const links = [
  ['Home', '/'],
  ['Programs', '/programs'],
  ['Companies', '/corporate-training'],
  ['About', '/about'],
  ['Contact', '/contact'],
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 transition duration-500', scrolled ? 'py-3' : 'py-5')}>
      <nav className={cn('mx-auto flex max-w-7xl items-center justify-between px-5 transition duration-500 md:px-8', scrolled && 'glass rounded-full py-2')}>
        <BrandMark />
        <div className="hidden items-center gap-7 md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className={cn('text-sm text-steel transition hover:text-white', pathname === href && 'text-white')}>
              {label}
            </Link>
          ))}
        </div>
        <button className="rounded-full border border-white/10 p-2 text-white md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      <AnimatePresence>
        {open ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-4 mt-3 rounded-[28px] border border-white/10 bg-obsidian/95 p-4 shadow-panel backdrop-blur-2xl md:hidden">
            {links.map(([label, href]) => <Link key={href} href={href} className="block rounded-2xl px-4 py-3 text-sm text-steel">{label}</Link>)}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
