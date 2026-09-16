import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../ui/ToastContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

export const ContentEditorPage: React.FC = () => {
  const [form, setForm] = useState<Record<string, string>>({
    business_name: '',
    hero_tagline: '',
    mission_title: '',
    mission_text: '',
    team_title: '',
    team_bio: '',
    contact_phone: '',
    contact_email: '',
    contact_address: '',
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const toast = useToast();

  const loadContent = async () => {
    try {
      setLoading(true);
      const res = await api.content.list();
      if (res && res.content) {
        setForm((prev) => ({
          ...prev,
          ...res.content,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar los textos';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Save all fields sequentially or in parallel
      const keys = Object.keys(form);
      for (const key of keys) {
        await api.content.update(key, form[key]);
      }
      toast.success('Todos los textos institucionales fueron actualizados con éxito.', 'Cambios guardados');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar los textos';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-stone-400">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando textos institucionales...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveAll} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Textos de la Web</h2>
          <p className="text-sm text-stone-400 mt-1">
            Edita los textos institucionales, la biografía del equipo y los datos de contacto del sitio público.
          </p>
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSaving}
          className="self-start sm:self-auto"
        >
          💾 Guardar todos los cambios
        </Button>
      </div>

      {/* 1. Empresa y Marca */}
      <Card title="Empresa y Marca" subtitle="Nombre de la empresa y lema del encabezado">
        <div className="space-y-4">
          <Input
            label="Nombre del negocio"
            value={form.business_name || ''}
            onChange={(e) => handleChange('business_name', e.target.value)}
            placeholder="Isard Wildland Experience"
          />

          <Input
            label="Frase principal (Hero Tagline)"
            value={form.hero_tagline || ''}
            onChange={(e) => handleChange('hero_tagline', e.target.value)}
            placeholder="Fabricamos experiencias."
          />

          <Input
            label="Título de 'Sobre Nosotros'"
            value={form.mission_title || ''}
            onChange={(e) => handleChange('mission_title', e.target.value)}
            placeholder="Líderes en turismo de experiencias en Andorra y los Pirineos."
          />

          <Textarea
            label="Texto descriptivo de la empresa"
            rows={4}
            value={form.mission_text || ''}
            onChange={(e) => handleChange('mission_text', e.target.value)}
            placeholder="Descubre un mundo de experiencias únicas con un solo operador turístico..."
          />
        </div>
      </Card>

      {/* 2. Equipo y Guías */}
      <Card title="Nuestro Equipo" subtitle="Presentación del equipo y biografía de Charly Paredes">
        <div className="space-y-4">
          <Input
            label="Título de la sección equipo"
            value={form.team_title || ''}
            onChange={(e) => handleChange('team_title', e.target.value)}
            placeholder="Fundada en 2018. Guiada por expertos locales."
          />

          <Textarea
            label="Biografía / Presentación de Charly"
            rows={5}
            value={form.team_bio || ''}
            onChange={(e) => handleChange('team_bio', e.target.value)}
            placeholder="iWE nació en 2018 de la mano de Charly Paredes, guía de montaña nivel 2..."
          />
        </div>
      </Card>

      {/* 3. Datos de Contacto */}
      <Card title="Datos de Contacto" subtitle="Información visible en el pie de página y botones de contacto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Teléfono de contacto"
            value={form.contact_phone || ''}
            onChange={(e) => handleChange('contact_phone', e.target.value)}
            placeholder="+376 344 870"
          />

          <Input
            label="Correo electrónico"
            type="email"
            value={form.contact_email || ''}
            onChange={(e) => handleChange('contact_email', e.target.value)}
            placeholder="info@i-wildland.com"
          />

          <div className="sm:col-span-2">
            <Input
              label="Dirección física"
              value={form.contact_address || ''}
              onChange={(e) => handleChange('contact_address', e.target.value)}
              placeholder="AD100 Canillo, Principat d'Andorra"
            />
          </div>
        </div>
      </Card>

      {/* Bottom Save Bar */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSaving}
          className="w-full sm:w-auto"
        >
          💾 Guardar todos los cambios
        </Button>
      </div>
    </form>
  );
};
