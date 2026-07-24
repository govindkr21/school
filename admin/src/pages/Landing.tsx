import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Clock, TrendingUp } from 'lucide-react'
import DemoModal from '../components/DemoModal'
import BrandLogo from '../components/BrandLogo'

const heading = { fontFamily: "'Vesper Libre', serif" }

const sampleCases = [
  { id: 'VL-2026-0184', age: '2 days old', title: 'Unsafe stairwell railing, Block C', status: 'Escalated', color: '#A63A2E', bg: '#F8E8E5' },
  { id: 'VL-2026-0183', age: '4 days old', title: 'Repeated bullying during lunch break', status: 'In progress', color: '#2F5D7C', bg: '#E6EEF4' },
  { id: 'VL-2026-0181', age: '6 days old', title: 'Bus route 7 arriving late', status: 'Awaiting review', color: '#A9741A', bg: '#FAF0DC' },
  { id: 'VL-2026-0178', age: '9 days old', title: 'Library fine charged twice', status: 'Resolved', color: '#1B5E3F', bg: '#E7F1E9' }
]

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="min-w-0">
    <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#FBF8F0]/50 min-[380px]:text-[10px] min-[380px]:tracking-[0.12em] sm:text-[12px] sm:tracking-[0.14em]">{label}</div>
    <div className="mt-1 whitespace-nowrap text-lg text-[#FBF8F0] min-[380px]:text-xl sm:mt-2 sm:text-2xl" style={heading}>{value}</div>
  </div>
)

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="rounded-2xl border border-[#EAE1CC] bg-white p-6">
    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7F1E9] text-[#1B5E3F]">{icon}</div>
    <div className="mt-4 text-lg font-semibold text-[#14231B]">{title}</div>
    <p className="mt-2 text-sm leading-relaxed text-[#5C6B62]">{desc}</p>
  </div>
)

const StepCard: React.FC<{ n: number; title: string; desc: string }> = ({ n, title, desc }) => (
  <div className="rounded-2xl border border-[#EAE1CC] bg-white p-6">
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DED2B6] font-mono text-sm text-[#134430]">{n}</div>
    <div className="mt-4 text-lg font-semibold text-[#14231B]">{title}</div>
    <p className="mt-2 text-sm leading-relaxed text-[#5C6B62]">{desc}</p>
  </div>
)

const Landing: React.FC = () => {
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#FBF8F0] text-[#14231B]" style={{ fontFamily: "'Vesper Libre', serif" }}>
      <header className="sticky top-0 z-30 border-b border-[#EAE1CC] bg-[#FBF8F0]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
          <Link to="/" className="flex items-center" aria-label="Madnir home">
            <BrandLogo className="h-11 w-11 sm:h-14 sm:w-14" priority />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#5C6B62] md:flex">
            <a href="#examples" className="hover:text-[#134430]">Example cases</a>
            <a href="#how-it-works" className="hover:text-[#134430]">How it works</a>
            <Link to="/login" className="hover:text-[#134430]">Sign in</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/signup" className="hidden rounded-xl border border-[#DED2B6] bg-white px-4 py-2.5 text-sm font-medium text-[#14231B] hover:border-[#134430] sm:inline-flex">
              Register your school
            </Link>
            <button onClick={() => setDemoOpen(true)} className="whitespace-nowrap rounded-xl bg-[#1B5E3F] px-3.5 py-2.5 text-xs font-semibold text-[#FBF8F0] shadow-lg shadow-[#134430]/20 transition hover:bg-[#134430] sm:px-5 sm:text-sm">
              Request a demo
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-x-clip bg-[#134430]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, #FBF8F0 31px, #FBF8F0 32px)' }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-9 px-4 py-8 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-28">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#75A98B] sm:text-xs sm:tracking-[0.14em]">Complaint management for schools &amp; colleges</div>
            <div className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#FBF8F0]/20 bg-[#FBF8F0]/10 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.11em] text-[#D8E6B5] shadow-sm backdrop-blur sm:mt-5 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.18em]">
              <span>Speak</span>
              <span className="text-[#B9C58C]">•</span>
              <span>Support</span>
              <span className="text-[#B9C58C]">•</span>
              <span>Succeed</span>
            </div>
            <h1 className="mt-4 text-[2rem] leading-[1.08] tracking-tight text-[#FBF8F0] min-[380px]:text-4xl sm:mt-6 sm:text-5xl lg:text-6xl" style={heading}>
              Every complaint gets a number, an owner, and a deadline.
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-6 text-[#FBF8F0]/75 sm:mt-6 sm:text-lg">
              Madnir turns scattered emails, phone calls, and hallway conversations into one register your
              leadership team can act on — and that parents and students can trust.
            </p>

            <div className="mt-6 flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-stretch sm:mt-10 sm:gap-4">
              <button
                onClick={() => setDemoOpen(true)}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#FBF8F0] px-5 py-3.5 text-sm font-semibold text-[#134430] shadow-[0_16px_35px_rgba(0,0,0,0.24)] transition hover:scale-[1.03] hover:bg-white active:scale-[0.98] sm:gap-3 sm:rounded-2xl sm:px-10 sm:py-5 sm:text-lg"
              >
                Request a free demo
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </button>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border border-[#FBF8F0]/25 px-5 py-3.5 text-sm font-medium text-[#FBF8F0] hover:bg-white/5 sm:rounded-2xl sm:px-8 sm:py-5 sm:text-base"
              >
                Sign in to your account
              </Link>
            </div>

            <div className="mt-7 grid max-w-lg grid-cols-3 gap-2 border-t border-[#FBF8F0]/10 pt-5 min-[380px]:gap-4 sm:mt-14 sm:gap-6 sm:pt-8">
              <Stat label="MEDIAN CLOSE" value="3.2 days" />
              <Stat label="OPEN CASES" value="18" />
              <Stat label="ESCALATED" value="2" />
            </div>
          </div>

          <div id="examples" className="relative min-w-0">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 shadow-2xl backdrop-blur sm:rounded-3xl sm:p-3">
              <div className="rounded-xl bg-[#FBF8F0] p-3 sm:rounded-2xl sm:p-5">
                <div className="mb-4 font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">
                  Recent complaints this week
                </div>
                <div className="divide-y divide-[#EAE1CC]">
                  {sampleCases.map((c) => (
                    <div key={c.id} className="flex min-w-0 items-center gap-2 py-3 pl-2 sm:gap-3 sm:pl-3" style={{ borderLeft: `3px solid ${c.color}` }}>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[12px] text-[#8B978F]">{c.id} · {c.age}</div>
                        <div className="truncate text-[16px] font-medium text-[#14231B]">{c.title}</div>
                      </div>
                      <span className="max-w-[42%] shrink-0 whitespace-nowrap rounded-full px-2 py-1 font-mono text-[10px] sm:max-w-none sm:px-3 sm:text-[12px]" style={{ background: c.bg, color: c.color }}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-[#FBF8F0]/50">
              Illustrative examples — every school's register is private to their organisation.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#8B978F]">Why schools use Madnir</div>
        <h2 className="mt-3 max-w-2xl text-3xl tracking-tight text-[#14231B]" style={heading}>
          From an anonymous note in a suggestion box to a case with a deadline.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Nothing falls through the cracks"
            desc="Every complaint — safety, bullying, transport, fees — gets a case ID the moment it's logged."
          />
          <FeatureCard
            icon={<Clock className="h-5 w-5" />}
            title="Deadlines, not good intentions"
            desc="Escalation timers flag cases that are past their response window automatically."
          />
          <FeatureCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="See patterns, not just tickets"
            desc="Median close time and case volume by category, visible to leadership at a glance."
          />
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#EAE1CC] bg-white/60">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#8B978F]">Getting started</div>
          <h2 className="mt-3 text-3xl tracking-tight text-[#14231B]" style={heading}>
            Open a register for your school in three steps.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <StepCard n={1} title="Organisation" desc="Tell us about your school — name, address, contact details, and sector." />
            <StepCard n={2} title="Verify email" desc="Confirm the organisation's email address with a one-time code." />
            <StepCard n={3} title="Plan and payment" desc="Choose a plan. Your admin account is created on the first successful payment." />
          </div>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link to="/signup" className="inline-flex items-center justify-center rounded-2xl bg-[#1B5E3F] px-8 py-4 text-base font-semibold text-[#FBF8F0] hover:bg-[#134430]">
              Register your school
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-2xl border border-[#DED2B6] bg-white px-8 py-4 text-base font-medium text-[#14231B] hover:border-[#134430]">
              Already registered? Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-10 text-sm text-[#8B978F] lg:px-10">
        <BrandLogo className="h-16 w-16 shrink-0" />
        <span>© 2026 Madnir. Private and public sector organisations are both supported.</span>
      </footer>

      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  )
}

export default Landing
