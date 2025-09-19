// client/src/i18n.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'lang';

const TRANSLATIONS = {
  en: {
    // Navigation
    'nav.search': 'Search',
    'nav.register': 'Register', // legacy (if still referenced)
    'nav.get_listed': 'Register your agency',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.my_cars': 'My Cars',
    'nav.add_car': 'Add Car',
    'nav.bookings': 'Bookings',

    // Generic UI
    'ui.account': 'Account',
    'ui.delete': 'Delete',
    'ui.confirm_delete_car': 'Are you sure you want to delete this car?',
    'ui.no_cars': 'No cars yet.',

    // Buttons
    'btn.view': 'View',
    'btn.create': 'Create',
    'btn.approve': 'Approve',
    'btn.decline': 'Decline',
    'btn.search': 'Search',
    'btn.agency_catalog': 'Agency catalog',

    // Labels / forms
    'forms.name': 'Full name',
    'forms.email': 'Email',
    'forms.phone': 'Phone',
    'forms.message': 'Message',
    'forms.start_date': 'Start date',
    'forms.end_date': 'End date',
    'tel': 'Tel',

    // Search page
    'search.title': 'Find your car',
    'filter.location': 'Location',
    'filter.min_per_day': 'Min/day',
    'filter.max_per_day': 'Max/day',
    'filter.category': 'Category',
    'select.city': 'Select a city',

    // Values
    'values.fuel.diesel': 'diesel',
    'values.fuel.petrol': 'petrol',
    'values.fuel.hybrid': 'hybrid',
    'values.transmission.manual': 'manual',
    'values.transmission.automatic': 'automatic',
    'values.fuel.electric': 'electric',

    // Car page
    'car.price_per_day': 'per day',
    'book.req_title': 'Booking request',

    // Add car
    'addcar.title': 'Add a new car',
    'addcar.create': 'Create car',

    // Agency register (legacy — kept in case you still show it anywhere)
    'areg.title': 'Agency registration',
    'areg.name': 'Agency name',
    'areg.email': 'Agency email',
    'areg.password': 'Password',
    'areg.location': 'Location',
    'areg.phone': 'Phone',
    'areg.create': 'Create agency',

    // Agency onboarding (Contact / Register your agency)
    'onboard.title': 'Register your agency',
    'onboard.text': 'Agency accounts are created by our team. Contact us and we’ll verify your details and set up your login.',

    // Bookings page
    'bookings.help': 'Manage and update booking requests from your clients.',

    // Misc
    'misc.no_cars': 'No cars match your filters.'
  },

  fr: {
    // Navigation
    'nav.search': 'Recherche',
    'nav.register': 'Inscription', // legacy
    'nav.get_listed': 'Enregistrer votre agence',
    'nav.login': 'Connexion',
    'nav.logout': 'Déconnexion',
    'nav.my_cars': 'Mes véhicules',
    'nav.add_car': 'Ajouter un véhicule',
    'nav.bookings': 'Réservations',

    // Generic UI
    'ui.account': 'Compte',
    'ui.delete': 'Supprimer',
    'ui.confirm_delete_car': 'Voulez-vous vraiment supprimer ce véhicule ?',
    'ui.no_cars': 'Aucun véhicule pour le moment.',

    // Buttons
    'btn.view': 'Voir',
    'btn.create': 'Créer',
    'btn.approve': 'Approuver',
    'btn.decline': 'Refuser',
    'btn.search': 'Rechercher',
    'btn.agency_catalog': 'Catalogue de l’agence',

    // Labels / forms
    'forms.name': 'Nom complet',
    'forms.email': 'Email',
    'forms.phone': 'Téléphone',
    'forms.message': 'Message',
    'forms.start_date': 'Date de début',
    'forms.end_date': 'Date de fin',
    'tel': 'Tél',

    // Search page
    'search.title': 'Trouvez votre voiture',
    'filter.location': 'Lieu',
    'filter.min_per_day': 'Min/jour',
    'filter.max_per_day': 'Max/jour',
    'filter.category': 'Catégorie',
    'select.city': 'Sélectionnez une ville',

    // Values
    'values.fuel.diesel': 'diesel',
    'values.fuel.petrol': 'essence',
    'values.fuel.hybrid': 'hybride',
    'values.transmission.manual': 'manuelle',
    'values.transmission.automatic': 'automatique',
    'values.fuel.electric': 'électrique',

    // Car page
    'car.price_per_day': 'par jour',
    'book.req_title': 'Demande de réservation',

    // Add car
    'addcar.title': 'Ajouter un véhicule',
    'addcar.create': 'Créer le véhicule',

    // Agency register (legacy)
    'areg.title': 'Inscription agence',
    'areg.name': 'Nom de l’agence',
    'areg.email': 'Email de l’agence',
    'areg.password': 'Mot de passe',
    'areg.location': 'Lieu',
    'areg.phone': 'Téléphone',
    'areg.create': 'Créer l’agence',

    // Agency onboarding (Contact / Register your agency)
    'onboard.title': 'Enregistrer votre agence',
    'onboard.text': 'Les comptes agences sont créés par notre équipe. Contactez-nous pour vérification et création de votre accès.',

    // Bookings page
    'bookings.help': 'Gérez et mettez à jour les demandes de réservation de vos clients.',

    // Misc
    'misc.no_cars': 'Aucun véhicule ne correspond à vos filtres.'
  }
};

// ———————————————————————————————————————————————
// i18n engine
// ———————————————————————————————————————————————
const I18nContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key, vars) => key
});

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'fr') return saved;
    // Fallback: browser language
    const nav = (navigator.language || 'en').toLowerCase();
    return nav.startsWith('fr') ? 'fr' : 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const t = useMemo(() => {
    return function translate(key, vars = {}) {
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
      let str = dict[key] ?? TRANSLATIONS.en[key] ?? key;
      // Simple {{var}} interpolation
      str = str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, v) => (vars[v] ?? ''));
      return str;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
