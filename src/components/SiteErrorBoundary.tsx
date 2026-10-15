import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getSystemMessages } from '../utils/systemMessages';
import type { LanguageCode } from '../context/PreferencesContext';

export default class SiteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Render a safe recovery screen without exposing internal details.
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const currentLanguage = document.documentElement.lang;
    const language: LanguageCode = ['es', 'ca', 'en', 'fr'].includes(currentLanguage)
      ? currentLanguage as LanguageCode : 'es';
    const message = getSystemMessages(language);
    return <main className="page-width section-space" role="alert">
      <h1>{message.renderError}</h1>
      <button type="button" onClick={() => window.location.reload()}>{message.retry}</button>
      <p><a href="/">{message.home}</a></p>
    </main>;
  }
}
