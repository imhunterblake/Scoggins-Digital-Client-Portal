// ── STATUS BADGE ──────────────────────────────────────────────
export const STATUS_CONFIG = {
  'awaiting_contract':  { label: 'Awaiting Contract',  dot: 'bg-yellow-400',   badge: 'bg-yellow-400/10 text-yellow-300 border border-yellow-400/20' },
  'awaiting_deposit':   { label: 'Awaiting Deposit',   dot: 'bg-orange-400',   badge: 'bg-orange-400/10 text-orange-300 border border-orange-400/20' },
  'awaiting_assets':    { label: 'Awaiting Assets',    dot: 'bg-blue-400',     badge: 'bg-blue-400/10 text-blue-300 border border-blue-400/20' },
  'in_progress':        { label: 'In Progress',        dot: 'bg-brand-cyan',   badge: 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20' },
  'in_review':          { label: 'In Review',          dot: 'bg-purple-400',   badge: 'bg-purple-400/10 text-purple-300 border border-purple-400/20' },
  'revisions':          { label: 'Revisions',          dot: 'bg-pink-400',     badge: 'bg-pink-400/10 text-pink-300 border border-pink-400/20' },
  'final_approval':     { label: 'Final Approval',     dot: 'bg-indigo-400',   badge: 'bg-indigo-400/10 text-indigo-300 border border-indigo-400/20' },
  'awaiting_final_payment': { label: 'Awaiting Final Payment', dot: 'bg-orange-400', badge: 'bg-orange-400/10 text-orange-300 border border-orange-400/20' },
  'launching':          { label: 'Launching',          dot: 'bg-green-400 animate-pulse', badge: 'bg-green-400/10 text-green-300 border border-green-400/20' },
  'complete':           { label: 'Complete',           dot: 'bg-green-500',    badge: 'bg-green-500/10 text-green-300 border border-green-500/20' },
  'on_hold':            { label: 'On Hold',            dot: 'bg-gray-400',     badge: 'bg-gray-400/10 text-gray-300 border border-gray-400/20' },
}

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['on_hold']
  return (
    <span className={`badge ${cfg.badge}`}>
      <span className={`status-dot ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── PROGRESS BAR ──────────────────────────────────────────────
export function ProgressBar({ value = 0 }) {
  return (
    <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-cyan-dim to-brand-cyan rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

// ── SKELETON ──────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

// ── EMPTY STATE ───────────────────────────────────────────────
export function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4 opacity-40">{icon}</div>
      <p className="font-display font-semibold text-white/60 mb-1">{title}</p>
      {sub && <p className="text-sm text-white/30 font-display mb-4">{sub}</p>}
      {action}
    </div>
  )
}

// ── MODAL ─────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── FILE SIZE FORMATTER ───────────────────────────────────────
export function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1024/1024).toFixed(1)} MB`
}

// ── DATE FORMATTER ────────────────────────────────────────────
export function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function timeAgo(str) {
  if (!str) return ''
  const d = Math.floor((Date.now() - new Date(str)) / 1000)
  if (d < 60) return 'just now'
  if (d < 3600) return `${Math.floor(d/60)}m ago`
  if (d < 86400) return `${Math.floor(d/3600)}h ago`
  return `${Math.floor(d/86400)}d ago`
}

// ── LOGO ──────────────────────────────────────────────────────
export function Logo({ size = 32 }) {
  return (
    <div style={{ width: size, height: size }}
      className="rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center flex-shrink-0">
      <span className="font-mono font-bold text-brand-cyan"
        style={{ fontSize: size * 0.35 }}>SD</span>
    </div>
  )
}
