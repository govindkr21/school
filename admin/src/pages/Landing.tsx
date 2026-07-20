import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Clock, TrendingUp } from 'lucide-react'
import DemoModal from '../components/DemoModal'

const heading = { fontFamily: "'Vesper Libre', serif" }

const sampleCases = [
  { id: 'VL-2026-0184', age: '2 days old', title: 'Unsafe stairwell railing, Block C', status: 'Escalated', color: '#A63A2E', bg: '#F8E8E5' },
  { id: 'VL-2026-0183', age: '4 days old', title: 'Repeated bullying during lunch break', status: 'In progress', color: '#2F5D7C', bg: '#E6EEF4' },
  { id: 'VL-2026-0181', age: '6 days old', title: 'Bus route 7 arriving late', status: 'Awaiting review', color: '#A9741A', bg: '#FAF0DC' },
  { id: 'VL-2026-0178', age: '9 days old', title: 'Library fine charged twice', status: 'Resolved', color: '#1B5E3F', bg: '#E7F1E9' }
]

const LogoMark: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 6.2C10.4 4.9 8.4 4.4 4 4.6v13c4.4-.2 6.4.3 8 1.6 1.6-1.3 3.6-1.8 8-1.6v-13c-4.4-.2-6.4.3-8 1.6Z" stroke={dark ? '#134430' : '#FBF8F0'} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12 6.2v12.9" stroke={dark ? '#134430' : '#FBF8F0'} strokeWidth="1.6" />
  </svg>
)

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#FBF8F0]/40">{label}</div>
    <div className="mt-2 text-2xl text-[#FBF8F0]" style={heading}>{value}</div>
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link to="/" className="flex items-center gap-2">
            <LogoMark dark />
            <span className="text-lg" style={heading}>Madnir</span>
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
            <button onClick={() => setDemoOpen(true)} className="rounded-xl bg-[#1B5E3F] px-5 py-2.5 text-sm font-semibold text-[#FBF8F0] shadow-lg shadow-[#134430]/20 transition hover:bg-[#134430]">
              Request a demo
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#134430]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, #FBF8F0 31px, #FBF8F0 32px)' }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-28">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#2F7B55]">Complaint management for schools &amp; colleges</div>
            <h1 className="mt-6 text-4xl leading-tight tracking-tight text-[#FBF8F0] sm:text-5xl lg:text-6xl" style={heading}>
              Every complaint gets a number, an owner, and a deadline.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[#FBF8F0]/70">
              Madnir turns scattered emails, phone calls, and hallway conversations into one register your
              leadership team can act on — and that parents and students can trust.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                onClick={() => setDemoOpen(true)}
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#FBF8F0] px-10 py-5 text-lg font-semibold text-[#134430] shadow-[0_20px_45px_rgba(0,0,0,0.28)] transition hover:scale-[1.03] hover:bg-white active:scale-[0.98]"
              >
                Request a free demo
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </button>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-[#FBF8F0]/25 px-8 py-5 text-base font-medium text-[#FBF8F0] hover:bg-white/5"
              >
                Sign in to your account
              </Link>
            </div>

            <div className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-[#FBF8F0]/10 pt-8">
              <Stat label="MEDIAN CLOSE" value="3.2 days" />
              <Stat label="OPEN CASES" value="18" />
              <Stat label="ESCALATED" value="2" />
            </div>
          </div>

          <div id="examples" className="relative">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl backdrop-blur">
              <div className="rounded-2xl bg-[#FBF8F0] p-5">
                <div className="mb-4 font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">
                  Recent complaints this week
                </div>
                <div className="divide-y divide-[#EAE1CC]">
                  {sampleCases.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 py-3 pl-3" style={{ borderLeft: `3px solid ${c.color}` }}>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[12px] text-[#8B978F]">{c.id} · {c.age}</div>
                        <div className="truncate text-[16px] font-medium text-[#14231B]">{c.title}</div>
                      </div>
                      <span className="whitespace-nowrap rounded-full px-3 py-1 font-mono text-[12px]" style={{ background: c.bg, color: c.color }}>
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

      <footer className="mx-auto max-w-7xl px-6 py-10 text-sm text-[#8B978F] lg:px-10">
        © 2026 Madnir. Private and public sector organisations are both supported.
      </footer>

      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  )
}

export default Landing
