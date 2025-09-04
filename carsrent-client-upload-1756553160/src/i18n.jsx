// client/src/i18n.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LS_KEY = 'vilis_lang';

const en = {
  nav: {
    search: 'Search',
    register: 'Register',
    login: 'Login',
    my_cars: 'My Cars',
    add_car: 'Add Car',
    bookings: 'Bookings',
    logout: 'Logout'
  },
  ui: {
    account: 'Account'
  },
  search: {
    title: 'Find a car'
  },
  filter: {
    location: 'Location',
    min_per_day: 'Min/day',
    max_per_day: 'Max/day'
  },
  btn: {
    search: 'Search',
    view: 'View',
    agency_catalog: 'Agency catalog',
    approve: 'Approve',
    decline: 'Decline',
    delete: 'Delete',
    save: 'Save',
    create: 'Create',
    login: 'Login'
  },
  car: {
    price_per_day: '/day'
  },
  tel: 'Tel',
  bookings: {
    help: 'Approve, decline, or delete booking requests.'
  },
  forms: {
    name: 'Name',
    email: 'Email (optional)',
    phone: 'Phone',
    password: 'Password',
    location: 'Location',
    title: 'Title',
    image_url: 'Photo URL (optional)',
    daily_price: 'Price / day (MAD)',
    year: 'Year',
    transmission: 'Transmission',
    seats: 'Seats',
    doors: 'Doors',
    trunk_liters: 'Trunk (L)',
    fuel_type: 'Fuel',
    start_date: 'Start date',
    end_date: 'End date',
    message: 'Message (optional)'
  },
  values: {
    transmission: { manual: 'manual', automatic: 'automatic' },
    fuel: { diesel: 'diesel', petrol: 'petrol', hybrid: 'hybrid', electric: 'electric' }
  },
  misc: {
    no_cars: 'No cars found.',
    no_bookings: 'No bookings yet.',
    back: 'Back'
  }
};

const fr = {
  nav: {
    search: 'Rechercher',
    register: "S'inscrire",
    login: 'Se connecter',
    my_cars: 'Mes voitures',
    add_car: 'Ajouter une voiture',
    bookings: 'Réservations',
    logout: 'Déconnexion'
  },
  ui: {
    account: 'Compte'
  },
  search: {
    title: 'Trouver une voiture'
  },
  filter: {
    location: 'Ville',
    min_per_day: 'Min/jour',
    max_per_day: 'Max/jour'
  },
  btn: {
    search: 'Rechercher',
    view: 'Voir',
    agency_catalog: "Catalogue d'agence",
    approve: 'Approuver',
    decline: 'Refuser',
    delete: 'Supprimer',
    save: 'Enregistrer',
    create: 'Créer',
    login: 'Connexion'
  },
  car: {
    price_per_day: '/jour'
  },
  tel: 'Tél',
  bookings: {
    help: 'Approuvez, refusez ou supprimez des demandes de réservation.'
  },
  forms: {
    name: 'Nom',
    email: 'Email (optionnel)',
    phone: 'Téléphone',
    password: 'Mot de passe',
    location: 'Ville',
    title: 'Titre',
    image_url: 'URL de la photo (optionnel)',
    daily_price: 'Prix / jour (MAD)',
    year: 'Année',
    transmission: 'Boîte',
    seats: 'Places',
    doors: 'Portes',
    trunk_liters: 'Coffre (L)',
    fuel_type: 'Carburant',
    start_date: 'Date début',
    end_date: 'Date fin',
    message: 'Message (optionnel)'
  },
  values: {
    transmission: { manual: 'manuelle', automatic: 'automatique' },
    fuel: { diesel: 'diesel', petrol: 'essence', hybrid: 'hybride', electric: 'électrique' }
  },
  misc: {
    no_cars: 'Aucun véhicule trouvé.',
    no_bookings: 'Aucune réservation.',
    back: 'Retour'
  }
};

const DICTS = { en, fr };

function getNested(obj, path) {
  return path.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), obj);
}

const I18nCtx = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(LS_KEY) || 'en');

  useEffect(() => {
    if (!DICTS[lang]) {
      setLangState('en');
      localStorage.setItem(LS_KEY, 'en');
    }
  }, [lang]);

  const setLang = (v) => {
    const val = DICTS[v] ? v : 'en';
    setLangState(val);
    localStorage.setItem(LS_KEY, val);
  };

  const t = useMemo(() => {
    const dict = DICTS[lang] || DICTS.en;
    return (key) => {
      const v = getNested(dict, key);
      if (v == null) {
        // fallback to EN, then key
        const v2 = getNested(DICTS.en, key);
        return v2 == null ? key : v2;
      }
      return v;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}
