import { useState, useEffect, useRef } from 'react'
import api from '../api'

function Modal({ title, contact, onSave, onClose }) {
  const [form, setForm] = useState(contact || { name: '', email: '', company: '', is_senator: false })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 24, width: 440, border: '1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>{title}</div>
        <div className="field"><label className="field-label">Name</label><input type="text" value={form.name} onChange={e => set('name', e.target.value)} /></div>
        <div className="field"><label className="field-label">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div className="field"><label className="field-label">Organization</label><input type="text" value={form.company} onChange={e => set('company', e.target.value)} /></div>
        <div className="field">
          <label className="field-label">Type</label>
          <select value={form.is_senator ? 'true' : 'false'} onChange={e => set('is_senator', e.target.value === 'true')}>
            <option value="true">Senator</option>
            <option value="false">Party-list</option>
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={() => { if (!form.name || !form.email) return alert('Name and email required'); onSave(form) }}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const importRef = useRef()

  const load = async () => {
    try {
      const res = await api.get('/api/contacts')
      setContacts(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error('Failed to load contacts:', e)
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    const match = c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    const typeMatch = filter === '' || String(c.is_senator) === filter
    return match && typeMatch
  })

  const handleAdd = async (form) => {
    await api.post('/api/contacts', form)
    load(); setModal(null)
  }
  const handleEdit = async (form) => {
    await api.put(`/api/contacts/${modal.index}`, form)
    load(); setModal(null)
  }
  const handleDelete = async (i) => {
    if (!window.confirm(`Delete ${contacts[i].name}?`)) return
    await api.delete(`/api/contacts/${i}`)
    load()
  }
  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return
    const fd = new FormData(); fd.append('file', file)
    api.post('/api/contacts/import', fd).then(r => { alert(`Imported ${r.data.imported} contacts`); load() })
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Contacts</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Manage your recipient list</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="sm" onClick={() => setModal({ mode: 'add' })}>+ Add</button>
          <button className="sm" onClick={() => importRef.current.click()}>Import CSV</button>
          <button className="sm" onClick={() => window.open('/api/contacts/export')}>Export CSV</button>
          <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[['Total', contacts.length], ['Senators', contacts.filter(c => c.is_senator).length], ['Party-list', contacts.filter(c => !c.is_senator).length]].map(([label, val]) => (
            <div key={label} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--mono)' }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <input type="text" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 220 }} />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto', padding: '7px 10px' }}>
            <option value="">All types</option>
            <option value="true">Senators</option>
            <option value="false">Party-list</option>
          </select>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{filtered.length} contacts</span>
        </div>

        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, overflow: 'hidden' }}>
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Type</th><th style={{ width: 100 }}></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>Loading…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>No contacts found</td></tr>}
              {filtered.map((c) => {
                const i = contacts.indexOf(c)
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td><span className="mono" style={{ fontSize: 12, color: 'var(--text2)' }}>{c.email}</span></td>
                    <td><span className={`badge ${c.is_senator ? 'senator' : 'partylist'}`}>{c.is_senator ? 'Senator' : 'Party-list'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="sm" onClick={() => setModal({ mode: 'edit', index: i, contact: c })}>Edit</button>
                        <button className="sm danger" onClick={() => handleDelete(i)}>Del</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal?.mode === 'add' && <Modal title="Add contact" onSave={handleAdd} onClose={() => setModal(null)} />}
      {modal?.mode === 'edit' && <Modal title="Edit contact" contact={modal.contact} onSave={handleEdit} onClose={() => setModal(null)} />}
    </div>
  )
}
