import { useState } from 'react';
import { deleteMyAccount, clearToken } from '../api';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';

export default function Account() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!confirm(t('ui.confirm_delete_account'))) return;
    setBusy(true); setMsg('');
    try {
      await deleteMyAccount({ password });
      clearToken();
      setMsg(t('ui.account_deleted'));
      setTimeout(() => nav('/'), 1200);
    } catch (e) {
      setMsg(e?.error || 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>{t('ui.account')}</h2>
      <div className="muted" style={{marginBottom:12}}>{t('ui.danger_zone')}</div>
      <form onSubmit={submit} className="row">
        <div className="col-6">
          <label>{t('areg.password')}</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <div className="col-12">
          <button className="btn" disabled={busy}>{t('ui.delete_account_btn')}</button>
        </div>
      </form>
      {msg && <div style={{marginTop:12}} className="error">{msg}</div>}
    </div>
  );
}
