import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const S = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh' },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 24px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0,
  },
  content: { flex: 1, overflowY: 'auto', padding: 24 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 10, padding: '14px 18px', border: '1px solid rgba(0,0,0,0.07)' },
  statLabel: { fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 },
  statVal: { fontSize: 24, fontWeight: 600, fontFamily: 'var(--mono)' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)', marginBottom: 12 },
  pillWrap: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  pill: (sel) => ({
    padding: '4px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
    border: '1px solid',
    borderColor: sel ? 'var(--accent)' : 'rgba(0,0,0,0.14)',
    background: sel ? 'var(--accent)' : '#fff',
    color: sel ? '#fff' : 'var(--text)',
    transition: 'background 0.12s, color 0.12s',
    userSelect: 'none',
  }),
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  logBox: {
    background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 10, padding: 16, minHeight: 120, maxHeight: 260,
    overflowY: 'auto', fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.9,
  },
  progBg: { background: 'var(--surface2)', borderRadius: 999, height: 4, marginTop: 8, overflow: 'hidden' },
  progFill: (pct) => ({ height: '100%', borderRadius: 999, background: 'var(--accent)', width: pct + '%', transition: 'width 0.3s' }),
};

function StatusDot({ status }) {
  const colors = { idle: '#9b9993', sending: '#BA7517', done: '#3B6D11', error: '#A32D2D' };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[status] || colors.idle, marginRight: 6 }} />;
}

export default function Send({ template }) {
  const [contacts, setContacts] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [smtp, setSmtp] = useState({ sender_email: 'denrncrkvcarabeo@gmail.com', sender_password: 'yjsa mcfl cgtu slzu', server: 'smtp.gmail.com', port: '587' });
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState([]);
  const [progress, setProgress] = useState(0);
  const logRef = useRef();

  useEffect(() => {
    axios.get('/api/contacts').then(r => setContacts(r.data));
    axios.get('/api/attachments').then(r => setAttachments(r.data));
  }, []);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);

  const toggle = (i) => setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const selectAll = () => setSelected(new Set(contacts.map((_, i) => i)));
  const selectSenators = () => setSelected(new Set(contacts.map((c, i) => c.is_senator ? i : null).filter(i => i !== null)));
  const selectPartylist = () => setSelected(new Set(contacts.map((c, i) => !c.is_senator ? i : null).filter(i => i !== null)));
  const clearAll = () => setSelected(new Set());

  const addLog = (line, type = 'info') => setLog(l => [...l, { line, type }]);

  const sendCampaign = async () => {
    if (!selected.size) { alert('Select at least one recipient.'); return; }
    setStatus('sending'); setLog([]); setProgress(0);
    const recipients = [...selected].map(i => contacts[i]);
    addLog(`Starting campaign — ${recipients.length} recipients, ${attachments.length} attachment(s)`);
    try {
      const res = await axios.post('/api/send', {
        smtp,
        recipients,
        subject: template.subject,
        body: `${template.salutation} {name},\n\n${template.body}`,
        attachments: attachments.map(a => a.name),
      });
      res.data.forEach((r, i) => {
        setProgress(Math.round((i + 1) / res.data.length * 100));
        addLog(`${r.success ? '✓' : '✗'} ${r.email.padEnd(40, ' ')} ${r.message}`, r.success ? 'ok' : 'err');
      });
      const ok = res.data.filter(r => r.success).length;
      addLog(`── Done: ${ok}/${res.data.length} sent successfully ──`, ok === res.data.length ? 'ok' : 'err');
      setStatus(ok === res.data.length ? 'done' : 'error');
    } catch (e) {
      addLog('Network error: ' + e.message, 'err');
      setStatus('error');
    }
  };

  const statusLabel = { idle: 'Idle', sending: 'Sending…', done: 'Done', error: 'Errors' }[status];

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Send Campaign</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Review and dispatch emails</div>
        </div>
      </div>
      <div style={S.content}>
        <div style={S.statsRow}>
          <div style={S.statCard}><div style={S.statLabel}>Recipients</div><div style={S.statVal}>{selected.size}</div></div>
          <div style={S.statCard}><div style={S.statLabel}>Attachments</div><div style={S.statVal}>{attachments.length}</div></div>
          <div style={S.statCard}>
            <div style={S.statLabel}>Status</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginTop: 6, display: 'flex', alignItems: 'center' }}>
              <StatusDot status={status} />{statusLabel}
            </div>
          </div>
        </div>

        <div style={S.section}>
          <div style={S.sectionTitle}>Select recipients</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="sm" onClick={selectAll}>All</button>
            <button className="sm" onClick={selectSenators}>Senators</button>
            <button className="sm" onClick={selectPartylist}>Party-list</button>
            <button className="sm" onClick={clearAll}>Clear</button>
          </div>
          <div style={S.pillWrap}>
            {contacts.map((c, i) => (
              <span key={i} style={S.pill(selected.has(i))} onClick={() => toggle(i)}>
                {c.name.split(' ').slice(0, 2).join(' ')}
              </span>
            ))}
          </div>
        </div>

        <div style={S.section}>
          <div style={S.sectionTitle}>SMTP configuration</div>
          <div style={S.formRow}>
            <div className="field"><label className="field-label">Sender email</label><input type="email" value={smtp.sender_email} onChange={e => setSmtp(s => ({ ...s, sender_email: e.target.value }))} /></div>
            <div className="field"><label className="field-label">App password</label><input type="password" value={smtp.sender_password} onChange={e => setSmtp(s => ({ ...s, sender_password: e.target.value }))} /></div>
          </div>
          <div style={S.formRow}>
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
              <div style={S.progBg}><div style={S.progFill(progress)} /></div>
            </div>
          )}
        </div>

        {log.length > 0 && (
          <div style={S.logBox} ref={logRef}>
            {log.map((l, i) => (
              <div key={i} style={{ color: l.type === 'ok' ? 'var(--green)' : l.type === 'err' ? 'var(--red)' : 'var(--text2)' }}>
                {l.line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
