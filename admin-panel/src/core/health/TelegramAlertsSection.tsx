import React from 'react';
import { Link } from 'react-router-dom';
import type { SiteHealthStatusResponse } from '../../api/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface TelegramAlertsSectionProps {
  telegram: SiteHealthStatusResponse['telegram'];
  sendingTelegram: boolean;
  onNotifyTelegram: () => void;
}

export const TelegramAlertsSection: React.FC<TelegramAlertsSectionProps> = ({
  telegram,
  sendingTelegram,
  onNotifyTelegram,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-primary flex items-center gap-2">
        <span>📢</span> Alertas Proactivas por Telegram
      </h2>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-primary">Bot de Alertas de Salud</span>
              {telegram.is_configured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ✓ Configurado y activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  ⚠️ No configurado
                </span>
              )}
            </div>
            <p className="text-xs text-secondary">
              El sistema envía un reporte automático a tu Telegram si algún componente de software pasa a estado crítico (🔴) y permite emitir reportes manuales en cualquier momento sin costo alguno.
            </p>

            {telegram.is_configured ? (
              <div className="flex items-center gap-4 text-xs font-mono text-secondary pt-1">
                <span>Token: <strong className="text-primary">{telegram.masked_token}</strong></span>
                <span>Chat ID: <strong className="text-primary">{telegram.chat_id}</strong></span>
              </div>
            ) : (
              <div className="text-xs text-secondary pt-1">
                Para habilitar avisos, carga <code>TELEGRAM_BOT_TOKEN</code> y <code>TELEGRAM_CHAT_ID</code> en la pantalla de{' '}
                <Link to="/settings/api-keys" className="text-accent underline font-medium">
                  Integraciones & API Keys
                </Link>.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              variant="secondary"
              onClick={onNotifyTelegram}
              disabled={!telegram.is_configured || sendingTelegram}
              className="flex items-center justify-center gap-2"
            >
              {sendingTelegram ? (
                <>
                  <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <span>📨</span> Notificar ahora por Telegram
                </>
              )}
            </Button>
            <Link
              to="/settings/api-keys"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-surface-elevated hover:bg-surface-hover text-secondary hover:text-primary border border-border transition-colors text-center"
            >
              <span>🔐</span> Configurar Credenciales
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

