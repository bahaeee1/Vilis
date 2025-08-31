// ...imports stay the same...
import { I18nProvider, useI18n } from './i18n.jsx'; // make sure it's .jsx

function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <select
      value={lang}
      onChange={(e)=>setLang(e.target.value)}
      className="lang"
      aria-label="Language"
    >
      <option value="en">EN</option>
      <option value="fr">FR</option>
    </select>
  );
}

function Shell({ children }) {
  const [hasToken, setHasToken] = useState(!!getToken());
  const nav = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    const onUpdate = () => setHasToken(!!getToken());
    window.addEventListener('tokenUpdated', onUpdate);
    return () => window.removeEventListener('tokenUpdated', onUpdate);
  }, []);

  const logout = () => { clearToken(); nav('/'); };

  return (
    <>
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="brand">{t('brand')}</div>
          <nav>
            <div className="nav-links">
              <NavLink to="/">{t('nav.search')}</NavLink>
              {hasToken ? (
                <>
                  <NavLink to="/agency/my-cars">{t('nav.my_cars')}</NavLink>
                  <NavLink to="/agency/add-car">{t('nav.add_car')}</NavLink>
                  <NavLink to="/agency/bookings">{t('nav.bookings')}</NavLink>
                  <button className="btn" onClick={logout}>{t('nav.logout')}</button>
                </>
              ) : (
                <>
                  <NavLink to="/agency/register">{t('nav.register')}</NavLink>
                  <NavLink to="/agency/login">{t('nav.login')}</NavLink>
                </>
              )}
            </div>
            <LangSwitch />
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
