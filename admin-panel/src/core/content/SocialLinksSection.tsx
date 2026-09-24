import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ImagePickerModal } from '../media/ImagePickerModal';
import type { MediaItem } from '../../api/types';

export interface SocialNetworkItem {
  id: string;
  name: string;
  url: string;
  icon?: string;
  is_auto_publish?: boolean;
  active?: boolean;
}

export const DEFAULT_SOCIAL_NETWORKS: SocialNetworkItem[] = [
  { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com/isardwildland/', icon: '📷', is_auto_publish: true, active: true },
  { id: 'facebook', name: 'Facebook', url: 'https://www.facebook.com/isardwildland/', icon: '📘', is_auto_publish: true, active: true },
  { id: 'tripadvisor', name: 'TripAdvisor', url: 'https://www.tripadvisor.com/', icon: '🦉', is_auto_publish: false, active: true },
  { id: 'whatsapp', name: 'WhatsApp', url: 'https://wa.me/376653769', icon: '💬', is_auto_publish: false, active: true },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/@isardwildland', icon: '▶️', is_auto_publish: false, active: true },
  { id: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com/@isardwildland', icon: '🎵', is_auto_publish: false, active: true },
  { id: 'strava', name: 'Strava', url: '', icon: '🚴', is_auto_publish: false, active: true },
  { id: 'linkedin', name: 'LinkedIn', url: '', icon: '💼', is_auto_publish: false, active: true },
  { id: 'twitter', name: 'X / Twitter', url: '', icon: '✖️', is_auto_publish: false, active: true },
];

export interface SocialLinksSectionProps {
  form: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export const SocialLinksSection: React.FC<SocialLinksSectionProps> = ({
  form,
  onChange,
}) => {
  const [networks, setNetworks] = useState<SocialNetworkItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SocialNetworkItem | null>(null);

  // Modal form states
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formIcon, setFormIcon] = useState('🌐');
  const [formAutoPublish, setFormAutoPublish] = useState(false);

  // Image picker modal
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  // Parse existing social networks from form.social_links_json or fallback to legacy form keys
  useEffect(() => {
    let parsed: SocialNetworkItem[] = [];
    if (form.social_links_json) {
      try {
        const json = JSON.parse(form.social_links_json);
        if (Array.isArray(json) && json.length > 0) {
          parsed = json;
        }
      } catch {
        // Fallback to legacy
      }
    }

    if (parsed.length === 0) {
      // Build from legacy form keys if available, otherwise DEFAULT_SOCIAL_NETWORKS
      parsed = DEFAULT_SOCIAL_NETWORKS.map((item) => {
        const legacyKey = `social_${item.id.replace('twitter', 'twitter')}`;
        return {
          ...item,
          url: form[legacyKey] !== undefined ? form[legacyKey] : item.url,
        };
      });
    }

    setNetworks(parsed);
  }, [form.social_links_json]);

  const syncToForm = (updatedList: SocialNetworkItem[]) => {
    setNetworks(updatedList);
    onChange('social_links_json', JSON.stringify(updatedList));

    // Keep individual backward-compatibility keys synced
    updatedList.forEach((net) => {
      const legacyKey = `social_${net.id}`;
      onChange(legacyKey, net.url || '');
    });
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormUrl('');
    setFormIcon('🌐');
    setFormAutoPublish(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: SocialNetworkItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormUrl(item.url);
    setFormIcon(item.icon || '🌐');
    setFormAutoPublish(Boolean(item.is_auto_publish));
    setModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingItem) {
      const updated = networks.map((net) =>
        net.id === editingItem.id
          ? {
              ...net,
              name: formName.trim(),
              url: formUrl.trim(),
              icon: formIcon.trim(),
              is_auto_publish: formAutoPublish,
            }
          : net
      );
      syncToForm(updated);
    } else {
      const newId = `social-${Date.now()}`;
      const newItem: SocialNetworkItem = {
        id: newId,
        name: formName.trim(),
        url: formUrl.trim(),
        icon: formIcon.trim() || '🌐',
        is_auto_publish: formAutoPublish,
        active: true,
      };
      syncToForm([...networks, newItem]);
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = networks.filter((net) => net.id !== id);
    syncToForm(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= networks.length) return;

    const list = [...networks];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    syncToForm(list);
  };

  const handleUrlInlineChange = (id: string, newUrl: string) => {
    const updated = networks.map((net) =>
      net.id === id ? { ...net, url: newUrl } : net
    );
    syncToForm(updated);
  };

  const handleSelectIconImage = (media: MediaItem) => {
    setFormIcon(media.url);
    setImagePickerOpen(false);
  };

  return (
    <>
      <Card
        title="Redes Sociales Oficiales (Dinámico)"
        subtitle="Gestiona los enlaces a perfiles, canales y opciones de difusión mostrados en el pie de página"
        action={
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
          >
            ➕ Agregar red social
          </Button>
        }
      >
        <div className="space-y-3">
          {networks.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm border border-dashed border-border rounded-xl">
              No hay redes sociales configuradas. Haz clic en "Agregar red social" para crear una.
            </div>
          ) : (
            networks.map((net, index) => {
              const isFirst = index === 0;
              const isLast = index === networks.length - 1;
              const isIconUrl = net.icon?.startsWith('http://') || net.icon?.startsWith('https://') || net.icon?.startsWith('/');

              return (
                <div
                  key={net.id}
                  className="p-3.5 bg-surface border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border-strong transition-colors"
                >
                  {/* Left: Reorder + Icon + Name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-0.5 bg-surface-elevated border border-border rounded-lg p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'up')}
                        disabled={isFirst}
                        className="p-1 text-xs text-muted hover:text-primary disabled:opacity-20 cursor-pointer"
                        title="Mover arriba"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'down')}
                        disabled={isLast}
                        className="p-1 text-xs text-muted hover:text-primary disabled:opacity-20 cursor-pointer"
                        title="Mover abajo"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      {isIconUrl ? (
                        <img src={net.icon} alt={net.name} className="w-5 h-5 object-contain" />
                      ) : (
                        <span className="text-base">{net.icon || '🌐'}</span>
                      )}
                    </div>

                    <div className="min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-primary">{net.name}</span>
                        {net.is_auto_publish ? (
                          <Badge variant="success" size="sm">Meta API</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">Referencia</Badge>
                        )}
                      </div>
                    </div>

                    {/* Inline URL edit input */}
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={net.url}
                        onChange={(e) => handleUrlInlineChange(net.id, e.target.value)}
                        placeholder={`URL de ${net.name}...`}
                        className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenEdit(net)}
                    >
                      ✏️ Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(net.id)}
                      className="text-danger-text hover:text-danger hover:bg-danger-soft"
                      title="Eliminar red social"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? `✏️ Editar Red Social: ${editingItem.name}` : '➕ Agregar Nueva Red Social'}
        description="Configura el nombre, URL, ícono y soporte de autopublicación directa."
        maxWidth="md"
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <Input
            label="Nombre de la Red Social"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Ej: Telegram, Strava, Threads..."
            required
          />

          <Input
            label="URL de Perfil / Canal"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder="https://..."
          />

          <div>
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1.5">
              Ícono (Emoji, Preset o URL de imagen)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                placeholder="📷 o URL de imagen"
                className="flex-1 bg-input border border-border rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setImagePickerOpen(true)}
              >
                🖼️ Seleccionar imagen
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/40 border border-border cursor-pointer">
              <input
                type="checkbox"
                checked={formAutoPublish}
                onChange={(e) => setFormAutoPublish(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent bg-surface border-border-strong"
              />
              <div>
                <span className="text-xs font-semibold text-primary block">
                  Soporta autopublicación directa (Meta Graph API / OAuth)
                </span>
                <span className="text-[11px] text-muted">
                  Marca esta opción solo si la red tiene integración API directa configurada (ej: Facebook Page, Instagram Business).
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!formName.trim()}
            >
              Guardar Red Social
            </Button>
          </div>
        </form>
      </Modal>

      {/* Media picker for custom icon */}
      <ImagePickerModal
        isOpen={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelectImage={handleSelectIconImage}
        selectedImageUrl={formIcon}
      />
    </>
  );
};
