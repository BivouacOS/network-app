import { useState, useEffect } from 'react'
import { Calendar, RefreshCw, X } from 'lucide-react'
import { useNetworkStore } from '../store/networkStore'
import {
  initGoogleServices,
  requestAccessToken,
  signOut,
  pullCalendarUpdates,
  syncFollowUpTasks,
  type PullResult,
  type PushResult,
} from '../services/googleCalendar'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined

interface SyncResult {
  pushed: number
  deleted: number
  pulled: number
}

const btn: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  gap: 3,
  width: 52, padding: '6px 4px', borderRadius: 8,
  fontSize: 10, fontWeight: 500,
  cursor: 'pointer', transition: 'all 0.15s', border: 'none',
}

export function CalendarSync() {
  const { nodes, updateNode } = useNetworkStore()
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!CLIENT_ID) return
    initGoogleServices(CLIENT_ID).catch(() => setError('Google services unavailable'))
  }, [])

  if (!CLIENT_ID) return null

  async function handleConnect() {
    setConnecting(true)
    setError(null)
    try {
      await requestAccessToken()
      setConnected(true)
    } catch {
      // user cancelled or denied — stay disconnected silently
    } finally {
      setConnecting(false)
    }
  }

  function handleDisconnect() {
    signOut()
    setConnected(false)
    setConnecting(false)
    setSyncing(false)
    setResult(null)
    setError(null)
  }

  async function handleSync() {
    setSyncing(true)
    setError(null)
    setResult(null)
    try {
      const personNodes = nodes.filter(n => n.type === 'person')

      const pushResult: PushResult = await syncFollowUpTasks(personNodes)
      for (const u of pushResult.nodeUpdates) {
        updateNode(u.nodeId, { gTaskId: u.gTaskId })
      }

      const pullResult: PullResult = await pullCalendarUpdates(personNodes)
      for (const u of pullResult.updates) {
        updateNode(u.nodeId, { lastContact: u.lastContact })
      }

      setResult({
        pushed: pushResult.pushed,
        deleted: pushResult.deleted,
        pulled: pullResult.updates.length,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        style={{ ...btn, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}
      >
        <Calendar size={19} />
        <span style={{ lineHeight: 1 }}>{connecting ? 'Connecting' : 'Calendar'}</span>
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <button
        onClick={handleSync}
        disabled={syncing}
        style={{ ...btn, background: '#16a34a18', border: '1px solid #16a34a44', color: '#86efac' }}
      >
        <RefreshCw size={19} className={syncing ? 'animate-spin' : ''} />
        <span style={{ lineHeight: 1 }}>{syncing ? 'Syncing' : 'Calendar'}</span>
      </button>

      {result && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 20,
          background: 'rgba(2,4,9,0.95)', border: '1px solid rgba(147,197,253,0.15)',
          borderRadius: 6, padding: '4px 8px', whiteSpace: 'nowrap',
          fontSize: 11, color: 'rgba(147,197,253,0.55)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>↑ {result.pushed} · ↓ {result.pulled}</span>
          <button onClick={() => setResult(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
            <X size={11} />
          </button>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 20,
          background: 'rgba(2,4,9,0.95)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 6, padding: '4px 8px', whiteSpace: 'nowrap',
          fontSize: 11, color: '#f87171',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>{error}</span>
          <button onClick={handleSync} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 11, padding: 0, textDecoration: 'underline' }}>Retry</button>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, lineHeight: 1 }}><X size={11} /></button>
        </div>
      )}

      <button
        onClick={handleDisconnect}
        style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 9, padding: '1px 0', lineHeight: 1, marginTop: 1 }}
      >
        disconnect
      </button>
    </div>
  )
}
