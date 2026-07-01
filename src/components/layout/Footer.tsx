import Link from 'next/link'
import BrandMark from '@/components/ui/BrandMark'

const groups = {
  Institute: [['Career Accelerator', '/career-accelerator'], ['Business Accelerator', '/business-ai-transformation'], ['Complete AI Accelerator', '/complete-ai-accelerator'], ['Corporate Training', '/corporate-training'], ['Webinars', '/webinars'], ['Resources', '/resources']],
  Company: [['About', '/about'], ['Ambassadors', '/ambassadors/apply'], ['Contact', '/contact'], ['Privacy', '/privacy']],
  Contact: [
    ['0701002613 | 08103200200', 'tel:0701002613'],
    ['nexoraadmi007@gmail.com', 'mailto:nexoraadmi007@gmail.com'],
    ['Asero, Abeokuta, Ogun State', '/contact'],
    ['WhatsApp', 'https://wa.me/2347084193822'],
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#020611]">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <BrandMark />
            <p className="mt-5 max-w-sm text-sm leading-7 text-steel">Nexora Institute helps career builders and business operators become AI-ready through practical training, community, and operating systems.</p>
            <p className="mt-6 text-xs uppercase tracking-[0.18em] text-steel/60">Build careers. Transform businesses. Work smarter with AI.</p>
          </div>
          {Object.entries(groups).map(([name, items]) => (
            <div key={name}>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white/50">{name}</p>
              <div className="grid gap-3">
                {items.map(([label, href]) => (
                  <Link key={label} href={href} className="text-sm text-steel transition hover:text-white">{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col justify-between gap-4 border-t border-white/10 pt-8 text-xs text-steel/60 md:flex-row">
          <span>Copyright {new Date().getFullYear()} NEXORA. All rights reserved.</span>
          <span>Airtable-powered growth system.</span>
        </div>
      </div>
    </footer>
  )
}
