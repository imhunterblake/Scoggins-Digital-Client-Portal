import { useState } from 'react'
import { sendMagicLink } from '../lib/supabase'
import { Logo } from '../components/UI'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [status, setStatus]   = useState('idle') // idle | loading | sent | error
  const [error, setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setError('')

    const { error } = await sendMagicLink(email.trim().toLowerCase())
    if (error) {
      setError(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark grid-bg flex items-center justify-center p-4">
      {/* Glow orbs */}
      <div className="glow-orb w-96 h-96 -top-20 -left-20 opacity-60" />
      <div className="glow-orb w-64 h-64 bottom-0 right-0 opacity-40" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Card */}
        <div className="card p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Logo size={40} />
            <div>
              <p className="font-display font-bold text-white text-lg leading-tight">Scoggins Digital</p>
              <p className="font-mono text-brand-cyan/60 text-xs">Client Portal</p>
            </div>
          </div>

          {status === 'sent' ? (
            // Success state
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">✉️</span>
              </div>
              <h2 className="font-display font-bold text-white text-xl mb-2">Check your email</h2>
              <p className="text-white/50 text-sm font-display leading-relaxed mb-4">
                We sent a secure login link to
              </p>
              <p className="font-mono text-brand-cyan text-sm bg-brand-cyan/10 px-4 py-2 rounded-xl border border-brand-cyan/20 mb-6">
                {email}
              </p>
              <p className="text-white/30 text-xs font-display">
                Click the link in your email to sign in. The link expires in 1 hour.
              </p>
              <button onClick={() => setStatus('idle')}
                className="mt-6 text-xs font-mono text-white/30 hover:text-white/60 transition-colors">
                ← Use a different email
              </button>
            </div>
          ) : (
            // Form state
            <>
              <h2 className="font-display font-bold text-white text-2xl mb-2">Welcome back</h2>
              <p className="text-white/40 text-sm font-display mb-8">
                Enter your email and we'll send you a secure login link. No password needed.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">Email Address</label>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <p className="text-red-300 text-sm font-display">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={status === 'loading' || !email}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                  {status === 'loading' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-brand-darker/30 border-t-brand-darker rounded-full animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      Send Login Link →
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-center text-xs text-white/20 font-display">
                  Don't have access yet? Contact{' '}
                  <a href="mailto:hunter@scoggins.digital"
                    className="text-brand-cyan/60 hover:text-brand-cyan transition-colors">
                    hunter@scoggins.digital
                  </a>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/15 font-mono mt-6">
          Scoggins Digital · scoggins.digital
        </p>
      </div>
    </div>
  )
}
