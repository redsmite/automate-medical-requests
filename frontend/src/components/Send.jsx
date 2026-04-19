import { useState, useEffect, useRef } from 'react'
import api from '../api'

function StatusDot({ status }) {
  const colors = { idle: '#9b9993', sending: '#BA7517', done: '#3B6D11', error: '#A32D2D' }
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[status] || colors.idle, marginRight: 6 }} />
}

export default function Send({ template }) {
  const [contacts, setContacts] = useState([])
  const [attachments, setAttachments] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [smtp, setSmtp] = useState({ sender_email: '', sender_password: '', server: 'smtp.gmail.com', port: '587' })
  const [status, setStatus] = useState('idle')
  const [log, setLog] = useState([])
  const [progress, setProgress] = useState(0)
  const logRef = useRef()

  useEffect(() => {
    api.get('/api/contacts').then(r => setContacts(Array.isArray(r.data) ? r.data : []))
    api.get('/api/attachments').then(r => setAttachments(Array.isArray(r.data) ? r.data : []))
  }, [])

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [log])

  const toggle = (i) => setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })
  const selectAll = () => setSelected(new Set(contacts.map((_, i) => i)))
  const selectSenators = () => setSelected(new Set(contacts.map((c, i) => c.is_senator ? i : null).filter(i => i !== null)))
  const selectPartylist = () => setSelected(new Set(contacts.map((c, i) => !c.is_senator ? i : null).filter(i => i !== null)))
  const clearAll = () => setSelected(new Set())

  const addLog = (line, type = 'info') => setLog(l => [...l, { line, type }])

  const sendCampaign = async () => {
    if (!selected.size) return alert('Select at least one recipient.')
    if (!smtp.sender_email || !smtp.sender_password) return alert('Enter your sender email and app password.')
    setStatus('sending'); setLog([]); setProgress(0)
    const recipients = [...selected].map(i => contacts[i])
    addLog(`Starting campaign — ${recipients.length} recipients, ${attachments.length} attachment(s)`)
    try {
      const res = await api.post('/api/send', {
        smtp,
        recipients,
        subject: template.subject,
        body: `${template.salutation} {name},\n\n${template.body}`,
        attachments: attachments.map(a => a.name),
      })
      res.data.forEach((r, i) => {
        setProgress(Math.round((i + 1) / res.data.length * 100))
        addLog(`${r.success ? '✓' : '✗'} ${r.email} — ${r.message}`, r.success ? 'ok' : 'err')
      })
      const ok = res.data.filter(r => r.success).length
      addLog(`── Done: ${ok}/${res.data.length} sent ──`, ok === res.data.length ? 'ok' : 'err')
      setStatus(ok === res.data.length ? 'done' : 'error')
    } catch (e) {
      addLog('Network error: ' + (e.response?.data?.detail || e.message), 'err')
      setStatus('error')
    }
  }

  const statusLabel = { idle: 'Idle', sending: 'Sending…', done: 'Done', error: 'Errors' }[status]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Send Campaign</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Review and dispatch emails</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[['Recipients selected', selected.size], ['Attachments', attachments.length]].map(([label, val]) => (
            <div key={label} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--mono)' }}>{val}</div>
            </div>
          ))}
          <div style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Status</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginTop: 6, display: 'flex', alignItems: 'center' }}>
              <StatusDot status={status} />{statusLabel}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)', marginBottom: 12 }}>Select recipients</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="sm" onClick={selectAll}>All</button>
            <button className="sm" onClick={selectSenators}>Senators only</button>
            <button className="sm" onClick={selectPartylist}>Party-list only</button>
            <button className="sm" onClick={clearAll}>Clear</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {contacts.map((c, i) => (
              <span key={i} onClick={() => toggle(i)} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', border: '1px solid', borderColor: selected.has(i) ? 'var(--accent)' : 'rgba(0,0,0,0.14)', background: selected.has(i) ? 'var(--accent)' : '#fff', color: selected.has(i) ? '#fff' : 'var(--text)', transition: 'all 0.12s', userSelect: 'none' }}>
                {c.name.split(' ').slice(0, 2).join(' ')}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)', marginBottom: 12 }}>SMTP configuration</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="field"><label className="field-label">Sender email</label><input type="email" value={smtp.sender_email} onChange={e => setSmtp(s => ({ ...s, sender_email: e.target.value }))} placeholder="your@gmail.com" /></div>
            <div className="field"><label className="field-label">App password</label><input type="password" value={smtp.sender_password} onChange={e => setSmtp(s => ({ ...s, sender_password: e.target.value }))} placeholder="xxxx xxxx xxxx xxxx" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field"><label className="field-label">SMTP server</label><input type="text" value={smtp.server} onChange={e => setSmtp(s => ({ ...s, server: e.target.value }))} /></div>
            <div className="field"><label className="field-label">Port</label><input type="text" value={smtp.port} onChange={e => setSmtp(s => ({ ...s, port: e.target.value }))} /></div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button className="primary" onClick={sendCampaign} disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : `Send to ${selected.size} recipient${selected.size !== 1 ? 's' : ''} ➤`}
          </button>
          {status === 'sending' && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{progress}%</div>
              <div style={{ background: 'var(--surface2)', borderRadius: 999, height: 4, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: 'var(--accent)', width: progress + '%', transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
        </div>

        {log.length > 0 && (
          <div ref={logRef} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: 16, minHeight: 120, maxHeight: 260, overflowY: 'auto', fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.9 }}>
            {log.map((l, i) => (
              <div key={i} style={{ color: l.type === 'ok' ? 'var(--green)' : l.type === 'err' ? 'var(--red)' : 'var(--text2)' }}>{l.line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
