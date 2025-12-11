import { ConnectButton } from '@rainbow-me/rainbowkit'
import { DelegationConstellation } from './constellation'

export function WelcomeHero() {
  return (
    <section className="flex flex-col items-center px-4 py-4">
      {/* Header Content */}
      <div className="text-center animate-fade-in-up">
        {/* Title with gradient and text shadow */}
        <h1
          className="bg-clip-text bg-gradient-to-r from-white via-white to-white/60 mb-4 text-display text-transparent"
          style={{ textShadow: '0 0 40px rgba(18, 255, 128, 0.3)' }}
        >
          DeFi, Delegated.
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-lg text-secondary text-xl leading-relaxed">
          Manage sub-accounts with granular DeFi permissions.
          <br />
          <span className="text-tertiary">Safe security. Full control.</span>
        </p>
      </div>

      {/* Constellation - Contained Area */}
      <div className="relative flex justify-center my-6 w-full max-w-4xl h-[500px]">
        <DelegationConstellation className="w-full h-full" />
      </div>

      {/* Feature pills with glass effect */}
      <div
        className="flex flex-wrap justify-center gap-3 animate-fade-in-up"
        style={{ animationDelay: '0.2s' }}
      >
        <FeaturePill icon="🔒">Safe Multisig</FeaturePill>
        <FeaturePill icon="⚡">Delegated Access</FeaturePill>
        <FeaturePill icon="🛡️">Granular Permissions</FeaturePill>
      </div>
    </section>
  )
}

function FeaturePill({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 bg-elevated/80 shadow-lg backdrop-blur-md px-4 py-2.5 border border-subtle rounded-full text-secondary text-small">
      <span>{icon}</span>
      <span>{children}</span>
    </div>
  )
}
