import React from 'react'

const heading = { fontFamily: "'Vesper Libre', serif" }

const STEPS = [
  { n: 1, label: 'Organisation' },
  { n: 2, label: 'Verify email' },
  { n: 3, label: 'Plan and payment' }
]

const RegistrationRail: React.FC<{ step: 1 | 2 | 3; title: string[]; description: string[] }> = ({ step, title, description }) => {
  return (
    <div className="hidden bg-[#134430] p-12 text-[#FBF8F0] lg:flex lg:flex-col lg:justify-between">
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#2F7B55]">Registration</div>
        <h1 className="mt-4 text-4xl leading-tight" style={heading}>
          {title.map((line) => (
            <React.Fragment key={line}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </h1>
        {description.map((line) => (
          <p key={line} className="mt-2 max-w-md text-[16px] text-[#FBF8F0]/70">
            {line}
          </p>
        ))}
      </div>

      <div className="flex flex-col">
        {STEPS.map((s, i) => {
          const isActive = s.n === step
          const isDone = s.n < step
          return (
            <div key={s.n} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs ' +
                    (isActive
                      ? 'bg-[#FBF8F0] text-[#134430]'
                      : isDone
                        ? 'bg-[#FBF8F0]/25 text-[#FBF8F0]'
                        : 'border border-[#FBF8F0]/20 text-[#FBF8F0]/40')
                  }
                >
                  {isDone ? '✓' : s.n}
                </div>
                {i < STEPS.length - 1 && <div className="my-1 h-9 w-px bg-[#FBF8F0]/15" />}
              </div>
              <div className={'pt-1 text-[16px] ' + (isActive ? 'font-medium text-[#FBF8F0]' : isDone ? 'text-[#FBF8F0]/70' : 'text-[#FBF8F0]/40')}>
                {s.label}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-sm text-[#FBF8F0]/40">Private and public sector organisations are both supported.</p>
    </div>
  )
}

export default RegistrationRail
