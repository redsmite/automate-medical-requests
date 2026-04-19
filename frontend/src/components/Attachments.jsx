import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const S = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh' },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 24px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0,
  },
  content: { flex: 1, overflowY: 'auto', padding: 24 },
  dropZone: {
    border: '1.5px dashed rgba(0,0,0,0.18)', borderRadius: 10,
    padding: '36px 24px', textAlign: 'center', cursor: 'pointer',
    background: '#fff', transition: 'background 0.15s',
  },
  fileRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', background: '#fff',
    border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
    marginBottom: 10,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 8,
    background: 'var(--surface2)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
  },
  empty: { textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 },
};

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf') return '📄';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['jpg', 'jpeg', 'png'].includes(ext)) return '🖼️';
  return '📁';
}

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function Attachments() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const load = () => axios.get('/api/attachments').then(r => setFiles(r.data));
  useEffect(() => { load(); }, []);

  const upload = async (fileList) => {
    for (const file of fileList) {
      const fd = new FormData(); fd.append('file', file);
      await axios.post('/api/attachments', fd);
    }
    load();
  };

  const remove = async (name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    await axios.delete(`/api/attachments/${name}`);
    load();
  };

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Attachments</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Files sent with every email</div>
        </div>
        <button className="sm" onClick={() => inputRef.current.click()}>+ Upload file</button>
        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={e => upload(e.target.files)} />
      </div>
      <div style={S.content}>
        {files.length === 0 && <div style={S.empty}>No attachments yet</div>}
        {files.map(f => (
          <div key={f.name} style={S.fileRow}>
            <div style={S.iconBox}>{fileIcon(f.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{f.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmtSize(f.size)}</div>
            </div>
            <a href={`/api/attachments/${f.name}`} target="_blank" rel="noreferrer">
              <button className="sm">View</button>
            </a>
            <button className="sm danger" onClick={() => remove(f.name)}>Remove</button>
          </div>
        ))}
        <div
          style={{ ...S.dropZone, background: dragging ? 'var(--surface2)' : '#fff' }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
          onClick={() => inputRef.current.click()}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Drop files here or click to upload</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>PDF, DOCX, JPG, PNG supported</div>
        </div>
      </div>
    </div>
  );
}
