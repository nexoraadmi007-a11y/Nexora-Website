'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type PremiumCardProps = {
  children: React.ReactNode
  className?: string
  delay?: number
}

export default function PremiumCard({ children, className, delay = 0 }: PremiumCardProps) {
  return (
    <motion.div
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn('glass rounded-[28px] p-6 transition duration-300 hover:border-white/20 md:p-8', className)}
    >
      {children}
    </motion.div>
  )
}
