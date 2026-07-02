'use client'

import { MessageCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

const number = '2347084193822'
const options = [
  ['Ask About Programs', "Hello NEXORA, I'd like to understand your AI training programs."],
  ['Corporate Training', "Hello NEXORA, I'd like to discuss AI training for my team or company."],
]

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open ? (
          <motion.div initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.96 }} className="glass w-[280px] rounded-[26px] p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-white/55">NEXORA Institute</p>
            <p className="mb-3 text-sm text-steel">Choose how you want to start.</p>
            <div className="grid gap-2">
              {options.map(([label, text]) => (
                <a key={label} target="_blank" rel="noreferrer" href={`https://wa.me/${number}?text=${encodeURIComponent(text)}`} className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-frost transition hover:bg-white/[0.07]">
                  {label}
                </a>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <button onClick={() => setOpen(!open)} className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-[#162536] text-white shadow-glow" aria-label="Open WhatsApp contact">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}
