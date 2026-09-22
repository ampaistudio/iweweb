import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import type { SiteHealthStatusResponse, BackupItem } from '../../api/types';
import { useToast } from '../ui/ToastContext';

export function useSiteHealthState() {
  const [healthData, setHealthData] = useState<SiteHealthStatusResponse | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'web' | 'dashboard'>('all');

  const toast = useToast();

  const loadData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const [statusRes, backupsRes] = await Promise.all([
        api.health.getStatus(forceRefresh),
        api.health.listBackups(),
      ]);

      if (statusRes) {
        setHealthData(statusRes);
      }
      if (backupsRes && backupsRes.backups) {
        setBackups(backupsRes.backups);
      }
      if (forceRefresh) {
        toast.success('Diagnóstico de versiones actualizado desde los registros oficiales.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar el diagnóstico de salud';
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      const res = await api.health.createBackup();
      if (res) {
        toast.success(`Respaldo creado con éxito (${res.size_human}).`);
        // Refresh backups list
        const backupsRes = await api.health.listBackups();
        if (backupsRes && backupsRes.backups) {
          setBackups(backupsRes.backups);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar el respaldo';
      toast.error(msg);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleNotifyTelegram = async () => {
    try {
      setSendingTelegram(true);
      await api.health.notifyTelegram();
      toast.success('Reporte de salud enviado correctamente al canal de Telegram.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar la notificación por Telegram';
      toast.error(msg);
    } finally {
      setSendingTelegram(false);
    }
  };

  return {
    healthData,
    backups,
    loading,
    refreshing,
    creatingBackup,
    sendingTelegram,
    activeTab,
    setActiveTab,
    loadData,
    handleCreateBackup,
    handleNotifyTelegram,
  };
}

