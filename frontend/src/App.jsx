import { useState } from 'react'
import Contacts from './components/Contacts'
import Attachments from './components/Attachments'
import Compose from './components/Compose'
import Send from './components/Send'

const NAV = [
  { id: 'contacts',    label: 'Contacts',    icon: '☰' },
  { id: 'attachments', label: 'Attachments', icon: '📎' },
  { id: 'compose',     label: 'Compose',     icon: '✏️' },
  { id: 'send',        label: 'Send',        icon: '➤' },
]

const DEFAULT_TEMPLATE = {
  subject: 'Request for Medical Assistance – Yvonne V. Carabeo',
  salutation: 'Dear Honorable',
  body: `Ako po si Yvonne V. Carabeo, asawa ni Reynaldo M. Carabeo. Kami po ay nakatira sa Brgy. San Vicente, Diliman, Quezon City.

Kaming mag-asawa ay parehas na senior citizen na po. Ako po ay may sakit na Chronic Kidney Disease Stage 5; kasalukuyang nagda-dialysis sa NKTI (National Kidney and Transplant Institution) tatlong beses sa isang linggo. Bagamat ang dialysis ay sagot na po ng PhilHealth, mayroon pa po kaming ibang binabayaran as co-payor sa kwarto ₱400.00 at AKAP (Ayuda para sa Kapos Palad) na ₱400 din po less senior discount, a total of ₱720.00 pesos kada session po. May mga procedures at laboratory tests na hindi po sagot ng PhilHealth katulad ng IV IRON at IPTH, atbp.

Ako po ay humihingi ng tulong medikal para sa aking:
① Dialysis
② Laboratory tests
③ Procedures
④ Medicines at dietaries

Lubos na nagpapasalamat.

Yvonne V. Carabeo`,
}

export default function App() {
  const [view, setView] = useState('contacts')
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: '100vh' }}>
      <aside style={{ background: '#fff', borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: 'var(--text2)' }}>
          MAILBLAST PH
        </div>
        {NAV.map(n => (
          <div
            key={n.id}
            onClick={() => setView(n.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 18px', fontSize: 13,
              fontWeight: view === n.id ? 500 : 400,
              color: view === n.id ? 'var(--text)' : 'var(--text2)',
              background: view === n.id ? 'var(--surface2)' : 'transparent',
              borderRight: view === n.id ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer', userSelect: 'none', transition: 'background 0.12s',
            }}
          >
            <span style={{ fontSize: 14 }}>{n.icon}</span>
            {n.label}
          </div>
        ))}
        <div style={{ marginTop: 'auto', padding: '12px 18px', fontSize: 11, color: 'var(--text3)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          API: <span style={{ fontFamily: 'var(--mono)' }}>:5000</span>
        </div>
      </aside>

      <main style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg)', minHeight: '100vh' }}>
        {view === 'contacts'    && <Contacts />}
        {view === 'attachments' && <Attachments />}
        {view === 'compose'     && <Compose template={template} setTemplate={setTemplate} />}
        {view === 'send'        && <Send template={template} />}
      </main>
    </div>
  )
}
