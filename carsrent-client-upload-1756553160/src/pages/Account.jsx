import { useState } from 'react';
import { deleteMyAccount, clearToken } from '../api';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';

export default function Account() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const doDelete = async () => {
    if (!confirm('Delete your agency account? This removes your cars and bookings.')) return;
    setBusy(true); setErr(''); setMsg('');
    try {
      await deleteMyAccount();
      clearToken();
      setMsg('Account deleted. Redirecting…');
      nav('/');
    } catch (e) {
      setErr(e?.error || 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>{t('ui.account')}</h2>
      <p className="muted">Manage your agency account.</p>

      {msg && <div style={{marginTop:10,color:'#1cc77e'}}>{msg}</div>}
      {err && <div className="error" style={{marginTop:10}}>{String(err)}</div>}

      <div style={{marginTop:16, display:'flex', gap:8, flexWrap:'wrap'}}>
        <button className="btn secondary" style={{borderColor:'#e35b66', color:'#ffb3ba'}}
                onClick={doDelete} disabled={busy}>
          {t('btn.delete') || 'Delete'}
        </button>
      </div>
    </div>
  );
}
