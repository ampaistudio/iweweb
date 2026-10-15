import type { LanguageCode } from '../context/PreferencesContext';

const messages = {
  es: { unavailable: 'No se pudo cargar parte del sitio.', retry: 'Reintentar', notFound: 'Página no encontrada', home: 'Volver al inicio', renderError: 'Ocurrió un error al mostrar la página.' },
  ca: { unavailable: 'No s’ha pogut carregar una part del lloc.', retry: 'Torna-ho a provar', notFound: 'Pàgina no trobada', home: 'Torna a l’inici', renderError: 'S’ha produït un error en mostrar la pàgina.' },
  en: { unavailable: 'Part of the site could not be loaded.', retry: 'Try again', notFound: 'Page not found', home: 'Back to home', renderError: 'An error occurred while displaying this page.' },
  fr: { unavailable: 'Une partie du site n’a pas pu être chargée.', retry: 'Réessayer', notFound: 'Page introuvable', home: 'Retour à l’accueil', renderError: 'Une erreur est survenue lors de l’affichage de cette page.' },
} satisfies Record<LanguageCode, Record<'unavailable' | 'retry' | 'notFound' | 'home' | 'renderError', string>>;

export function getSystemMessages(language: LanguageCode) {
  return messages[language];
}
