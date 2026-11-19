import { useEffect, useState } from 'react';
import { api, type MaintenanceState } from '../../api/client';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function UpdatePlanSection() {
  const [state, setState] = useState<MaintenanceState | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (saving) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const result = await api.health.maintenance();
        if (active) { setState(result); setError(''); }
      } catch (err) {
        if (active) { setState(null); setError((err as Error).message); }
      } finally {
        if (active) timer = setTimeout(refresh, 5000);
      }
    }
    void refresh();
    return () => { active = false; clearTimeout(timer); };
  }, [saving]);

  async function submit(command: { start: true } | { automatic: boolean }) {
    setSaving(true);
    try { setState(await api.health.maintenance(command)); setError(''); }
    catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  }

  return <Card className="p-6 space-y-4">
    <h2 className="text-lg font-bold text-primary">Actualizaciones del sitio</h2>
    <p className="text-sm text-secondary">El ejecutor prueba una tanda por vez en la copia local de mantenimiento.</p>
    <div className="flex flex-wrap items-center gap-5">
      <Button disabled={!state?.online || state.busy || saving} onClick={() => submit({ start: true })}>Actualizar ahora</Button>
      <label className="flex items-center gap-2">
        <input type="checkbox" role="switch" checked={state?.automatic ?? false} disabled={!state?.online || saving}
          onChange={event => submit({ automatic: event.target.checked })} />
        Actualizaciones automáticas
      </label>
    </div>
    <p role="status" className="text-sm text-secondary">{error || (state && !state.online ? 'Ejecutor desconectado.' : state?.message) || 'Consultando ejecutor…'}</p>
  </Card>;
}
