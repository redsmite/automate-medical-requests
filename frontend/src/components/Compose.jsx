import { useState } from 'react';

const S = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh' },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 24px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0,
  },
  content: { flex: 1, overflowY: 'auto', padding: 24 },
  tabRow: { display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 20 },
  tab: (active) => ({
    padding: '8px 18px', fontSize: 13, cursor: 'pointer',
    color: active ? 'var(--text)' : 'var(--text2)',
    fontWeight: active ? 500 : 400,
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    marginBottom: -1,
  }),
  preview: {
    background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 10, overflow: 'hidden',
  },
  previewHead: {
    background: 'var(--surface2)', padding: '12px 18px',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
  },
  previewBody: {
    padding: 18, fontFamily: 'var(--mono)', fontSize: 12,
    lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text)',
  },
};

const SALUTATIONS = ['Dear Honorable', 'Dear Senator', 'Dear Representative', 'To the Office of'];

export default function Compose({ template, setTemplate }) {
  const [tab, setTab] = useState('edit');
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setTemplate(t => ({ ...t, [k]: v }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Compose</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Write your email template</div>
        </div>
        <button className="primary sm" onClick={save}>{saved ? '✓ Saved' : 'Save template'}</button>
      </div>
      <div style={S.content}>
        <div style={S.tabRow}>
          <div style={S.tab(tab === 'edit')} onClick={() => setTab('edit')}>Edit</div>
          <div style={S.tab(tab === 'preview')} onClick={() => setTab('preview')}>Preview</div>
        </div>

        {tab === 'edit' && (
          <>
            <div className="field">
              <label className="field-label">Subject line</label>
              <input type="text" value={template.subject} onChange={e => set('subject', e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Salutation</label>
              <select value={template.salutation} onChange={e => set('salutation', e.target.value)}>
                {SALUTATIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Body</label>
              <textarea
                value={template.body}
                onChange={e => set('body', e.target.value)}
                style={{ minHeight: 280 }}
              />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: -6 }}>
              Tip: Use <code style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 4 }}>{'{name}'}</code> and <code style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 4 }}>{'{company}'}</code> for personalization.
            </div>
          </>
        )}

        {tab === 'preview' && (
          <div style={S.preview}>
            <div style={S.previewHead}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{template.subject}</div>
            </div>
            <div style={S.previewBody}>
              {template.salutation} [Recipient Name],{'\n\n'}{template.body}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
