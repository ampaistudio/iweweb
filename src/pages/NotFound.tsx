import { Link } from 'react-router-dom';
import { usePreferences } from '../context/PreferencesContext';
import { getSystemMessages } from '../utils/systemMessages';

export default function NotFound() {
  const { language } = usePreferences();
  const message = getSystemMessages(language);
  return <main className="page-width section-space" role="main">
    <h1>{message.notFound}</h1>
    <Link to="/">{message.home}</Link>
  </main>;
}
