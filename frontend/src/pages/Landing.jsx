import { useNavigate } from 'react-router-dom';

const steps = [
  { icon: '📋', title: 'Report Item', desc: 'Report a lost or found item with photos, description, and location.' },
  { icon: '🤖', title: 'Smart Matching', desc: 'Our system automatically matches lost and found items by category, keywords, and location.' },
  { icon: '🤝', title: 'Connect Safely', desc: 'Request contact info — shared only after mutual approval, ensuring privacy.' },
  { icon: '✅', title: 'Verify & Return', desc: 'Use the secret code to verify the handshake and complete the return.' },
];

const stats = [
  { value: '2,400+', label: 'Items Recovered' },
  { value: '94%', label: 'Match Accuracy' },
  { value: '48h', label: 'Avg. Return Time' },
  { value: '12', label: 'City Districts' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink-900 grain-overlay">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-ink-900/80 backdrop-blur-md border-b border-ink-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#0D0D0D" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <span className="font-display font-bold text-lg text-ink-50 tracking-tight">
            Lost<span className="text-amber-400">&</span>Found
          </span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="btn-primary text-sm py-2 px-5"
        >
          Login
        </button>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#FFC107 1px, transparent 1px), linear-gradient(90deg, #FFC107 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-ink-800 border border-ink-700 rounded-full px-4 py-1.5 mb-8">
            <div className="w-2 h-2 bg-signal-green rounded-full animate-pulse" />
            <span className="text-xs font-mono text-ink-300 uppercase tracking-widest">Smart City Initiative</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-black text-ink-50 leading-none tracking-tight mb-6 text-balance">
            Lost something?<br />
            <span className="text-amber-400">We'll find it.</span>
          </h1>

          <p className="text-lg text-ink-400 font-body mb-10 max-w-xl mx-auto text-balance">
            A secure, community-driven platform that reunites people with their lost belongings using intelligent matching and privacy-first contact sharing.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/login')} className="btn-primary text-base py-3.5 px-8">
              Get Started — It's Free
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-secondary text-base py-3.5 px-8"
            >
              How It Works
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-ink-600" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-ink-800 bg-ink-800/30 px-6 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-display font-black text-amber-400">{s.value}</div>
              <div className="text-sm text-ink-500 font-mono mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="section-title mb-3">Process</p>
          <h2 className="text-4xl font-display font-black text-ink-50">How it works</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%-12px)] w-6 h-px bg-ink-700 z-10" />
              )}
              <div className="card p-6 h-full group hover:border-amber-400/30 transition-colors">
                <div className="w-14 h-14 rounded-xl bg-ink-700 flex items-center justify-center text-2xl mb-4 group-hover:bg-ink-600 transition-colors">
                  {step.icon}
                </div>
                <div className="text-xs font-mono text-ink-600 mb-2">0{i + 1}</div>
                <h3 className="font-display font-bold text-ink-50 mb-2">{step.title}</h3>
                <p className="text-sm text-ink-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-ink-800 bg-ink-800/20 px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-title mb-3">Security & Privacy</p>
            <h2 className="text-4xl font-display font-black text-ink-50">Built with trust</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🔐', title: 'Firebase Auth', desc: 'Google login + Phone OTP — two layers of verified identity.' },
              { icon: '🔒', title: 'Contact Gating', desc: 'Phone numbers are hidden until both parties approve contact sharing.' },
              { icon: '🤝', title: 'Secret Handshake', desc: 'Bcrypt-encrypted codes verify physical exchange before marking resolved.' },
            ].map((f) => (
              <div key={f.title} className="card p-6">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-display font-bold text-ink-50 mb-2">{f.title}</h3>
                <p className="text-sm text-ink-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl font-display font-black text-ink-50 mb-4">Ready to recover?</h2>
          <p className="text-ink-400 mb-8">Join thousands of citizens helping each other reconnect with lost belongings.</p>
          <button onClick={() => navigate('/login')} className="btn-primary text-base py-4 px-10">
            Start Now →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-800 px-6 py-6 text-center">
        <p className="text-xs text-ink-600 font-mono">
          Lost & Found · Smart City Platform · Built with ❤️ for the community
        </p>
      </footer>
    </div>
  );
}
