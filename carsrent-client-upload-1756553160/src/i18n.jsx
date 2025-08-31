import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

const I18nCtx = createContext(null);

const DICT = {
  en: {
    brand: 'Vilis',
    // nav
    'nav.search': 'Search',
    'nav.register': 'Register',
    'nav.login': 'Login',
    'nav.my_cars': 'My Cars',
    'nav.add_car': 'Add Car',
    'nav.bookings': 'Bookings',
    'nav.logout': 'Logout',
    // search
    'search.title': 'Find a car',
    'filter.location': 'Location',
    'filter.anywhere': 'Anywhere',
    'filter.min_per_day': 'Min/day',
    'filter.max_per_day': 'Max/day',
    'btn.search': 'Search',
    'agency': 'Agency',
    'tel': 'Tel',
    'btn.view': 'View',
    'btn.agency_catalog': "Agency catalog",
    // car page
    'car.loading': 'Loading car...',
    'car.price_per_day': ' / day',
    'car.agency_contact': 'Agency contact',
    'car.view_agency_catalog': "View agency catalog",
    'car.specs': 'Specifications',
    'car.choose_dates': 'Choose your dates',
    'car.start': 'Start',
    'car.end': 'End',
    'car.your_details': 'Your details',
    'car.name': 'Name',
    'car.email_optional': 'Email (optional)',
    'car.phone_required': 'Phone *',
    'car.book': 'Book',
    // agency register
    'areg.title': 'Agency Register',
    'areg.name': 'Name',
    'areg.location': 'Location',
    'areg.email': 'Email',
    'areg.password': 'Password',
    'areg.phone': 'Phone',
    'areg.create': 'Create account',
    // add car
    'acar.title': 'Add Car',
    'acar.brand': 'Brand',
    'acar.model': 'Model',
    'acar.year': 'Year',
    'acar.transmission': 'Transmission',
    'acar.automatic': 'automatic',
    'acar.manual': 'manual',
    'acar.seats': 'Seats',
    'acar.doors': 'Doors',
    'acar.trunk': 'Trunk (L)',
    'acar.fuel': 'Fuel',
    'acar.options': 'Options',
    'acar.price_day': 'Price/day',
    'acar.location': 'Location',
    'acar.photo': 'Photo URL',
    'acar.description': 'Description',
    'acar.save': 'Save car',
    'select.city': 'Select city…',
    'select.fuel': 'Select fuel…',
  },
  fr: {
    brand: 'Vilis',
    // nav
    'nav.search': 'Recherche',
    'nav.register': "S'inscrire",
    'nav.login': 'Se connecter',
    'nav.my_cars': 'Mes voitures',
    'nav.add_car': 'Ajouter une voiture',
    'nav.bookings': 'Réservations',
    'nav.logout': 'Déconnexion',
    // search
    'search.title': 'Trouver une voiture',
    'filter.location': 'Ville',
    'filter.anywhere': 'Partout',
    'filter.min_per_day': 'Min/jour',
    'filter.max_per_day': 'Max/jour',
    'btn.search': 'Rechercher',
    'agency': 'Agence',
    'tel': 'Tél',
    'btn.view': 'Voir',
    'btn.agency_catalog': "Catalogue de l'agence",
    // car page
    'car.loading': 'Chargement de la voiture…',
    'car.price_per_day': ' / jour',
    'car.agency_contact': "Contact de l'agence",
    'car.view_agency_catalog': "Voir le catalogue de l'agence",
    'car.specs': 'Caractéristiques',
    'car.choose_dates': 'Choisissez vos dates',
    'car.start': 'Début',
    'car.end': 'Fin',
    'car.your_details': 'Vos coordonnées',
    'car.name': 'Nom',
    'car.email_optional': 'Email (facultatif)',
    'car.phone_required': 'Téléphone *',
    'car.book': 'Réserver',
    // agency register
    'areg.title': "Inscription d'agence",
    'areg.name': 'Nom',
    'areg.location': 'Ville',
    'areg.email': 'Email',
    'areg.password': 'Mot de passe',
    'areg.phone': 'Téléphone',
    'areg.create': 'Créer le compte',
    // add car
    'acar.title': 'Ajouter une voiture',
    'acar.brand': 'Marque',
    'acar.model': 'Modèle',
    'acar.year': 'Année',
    'acar.transmission': 'Transmission',
    'acar.automatic': 'automatique',
    'acar.manual': 'manuelle',
    'acar.seats': 'Places',
    'acar.doors': 'Portes',
    'acar.trunk': 'Coffre (L)',
    'acar.fuel': 'Carburant',
    'acar.options': 'Options',
    'acar.price_day': 'Prix/jour',
    'acar.location': 'Ville',
    'acar.photo': 'URL de la photo',
    'acar.description': 'Description',
    'acar.save': 'Enregistrer',
    'select.city': 'Choisir une ville…',
    'select.fuel': 'Choisir un carburant…',
  }
};

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);
  const t = useMemo(
    () => (key) => (DICT[lang] && DICT[lang][key]) || (DICT.en[key] ?? key),
    [lang]
  );
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return React.createElement(I18nCtx.Provider, { value }, children);
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
