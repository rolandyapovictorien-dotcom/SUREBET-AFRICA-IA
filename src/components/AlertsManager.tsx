import React, { useState } from 'react';
import {
  Bell,
  Bookmark,
  Clock,
  CheckCircle2,
  Volume2,
  Trash2,
  Plus,
  Send,
  MessageSquare,
  Shield,
  Calculator,
} from 'lucide-react';
import { SurebetOpportunity } from '../types/surebet';
import { SPORTS_REGISTRY } from '../data/bookmakers';
import { formatPercent, formatFcfa } from '../utils/formatters';

interface AlertsManagerProps {
  favorites: string[];
  onRemoveFavorite: (id: string) => void;
  onOpenCalculator: (surebet: SurebetOpportunity) => void;
}

interface AlertRule {
  id: string;
  minYield: number;
  sport: string;
  channel: 'in_app' | 'whatsapp' | 'sms';
  targetContact?: string;
  active: boolean;
}

export const AlertsManager: React.FC<AlertsManagerProps> = ({
  favorites,
  onRemoveFavorite,
  onOpenCalculator,
}) => {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: 'rule-1',
      minYield: 2.5,
      sport: 'all',
      channel: 'in_app',
      active: true,
    },
    {
      id: 'rule-2',
      minYield: 4.0,
      sport: 'football',
      channel: 'whatsapp',
      targetContact: '+225 07 00 00 00',
      active: true,
    },
  ]);

  const [minYieldInput, setMinYieldInput] = useState<number>(3.0);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<'in_app' | 'whatsapp' | 'sms'>('in_app');
  const [phoneInput, setPhoneInput] = useState<string>('+225 ');
  const [testAlertTriggered, setTestAlertTriggered] = useState<boolean>(false);

  // Historique des arbitrages passés pour analyse de persistance
  const [historyLogs] = useState([
    {
      id: 'hist-1',
      match: 'Real Madrid vs Bayern Munich',
      competition: 'UEFA Champions League',
      yieldPercent: 3.42,
      durationMinutes: 14,
      market: '1X2',
      closedAt: 'Il y a 32 min',
      resolution: 'Cote Betclic réajustée (2.90 -> 2.65)',
    },
    {
      id: 'hist-2',
      match: 'LA Lakers vs Golden State Warriors',
      competition: 'NBA',
      yieldPercent: 2.18,
      durationMinutes: 48,
      market: 'Face-à-Face',
      closedAt: 'Il y a 1h 15 min',
      resolution: 'Pari validé avec succès par les traders',
    },
    {
      id: 'hist-3',
      match: 'ASEC Mimosas vs Stella Club',
      competition: 'Ligue 1 Côte d\'Ivoire',
      yieldPercent: 4.85,
      durationMinutes: 6,
      market: 'Plus/Moins 2.5',
      closedAt: 'Il y a 2h 40 min',
      resolution: 'Fermeture rapide du marché Sportcash',
    },
  ]);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: AlertRule = {
      id: 'rule-' + Date.now(),
      minYield: minYieldInput,
      sport: selectedSport,
      channel: selectedChannel,
      targetContact: selectedChannel !== 'in_app' ? phoneInput : undefined,
      active: true,
    };
    setAlertRules([...alertRules, newRule]);
  };

  const handleToggleRule = (id: string) => {
    setAlertRules(
      alertRules.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const handleDeleteRule = (id: string) => {
    setAlertRules(alertRules.filter((r) => r.id !== id));
  };

  const triggerTestAlert = () => {
    setTestAlertTriggered(true);
    // Beep audio test si supporté par le navigateur
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {}

    setTimeout(() => setTestAlertTriggered(false), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Kicker et Titre */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Surveillance Automatisée</span>
            <span aria-hidden="true">·</span>
            <span>Seuils Personnalisés</span>
            <span aria-hidden="true">·</span>
            <span>Multi-Canaux</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white font-display">
            Gestionnaire d'Alertes & Historique
          </h1>
        </div>

        <button
          onClick={triggerTestAlert}
          className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors whitespace-nowrap shrink-0"
        >
          <Volume2 className="h-3.5 w-3.5" />
          <span>Tester le signal sonore / alerte</span>
        </button>
      </div>

      {testAlertTriggered && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-400" />
            <div>
              <span className="font-bold">Test d'Alerte SUREBET AFRICA AI Réussi !</span>
              <p className="text-[11px] text-emerald-300/80">
                Notification sonore envoyée. En conditions réelles, le signal retentit instantanément dès qu'une cote correspond à vos critères.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">Signal 880Hz</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Création d'une règle d'alerte */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">
              Configurer une Alerte d'Arbitrage
            </h2>

            <form onSubmit={handleAddRule} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Rendement minimum déclencheur</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={minYieldInput}
                    onChange={(e) => setMinYieldInput(parseFloat(e.target.value))}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="font-mono font-bold text-emerald-400 text-sm w-12 text-right">
                    {minYieldInput.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Sport surveillé</label>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">Tous les sports</option>
                  {SPORTS_REGISTRY.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Canal de réception</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('in_app')}
                    className={`p-2 text-center rounded border transition-colors ${
                      selectedChannel === 'in_app'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    In-App Audio
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('whatsapp')}
                    className={`p-2 text-center rounded border transition-colors ${
                      selectedChannel === 'whatsapp'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('sms')}
                    className={`p-2 text-center rounded border transition-colors ${
                      selectedChannel === 'sms'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    SMS
                  </button>
                </div>
              </div>

              {selectedChannel !== 'in_app' && (
                <div>
                  <label className="text-slate-400 block mb-1">Numéro Mobile (CI ou International)</label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+225 07..."
                    className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors"
              >
                Activer cette alerte
              </button>
            </form>
          </div>

          {/* Liste des règles actives */}
          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mes Alertes Actives ({alertRules.length})
            </h3>

            <div className="space-y-2">
              {alertRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">
                        &gt; {rule.minYield.toFixed(1)}%
                      </span>
                      <span className="text-slate-400 font-medium">
                        {rule.sport === 'all' ? 'Tous sports' : rule.sport}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span>Canal : {rule.channel.toUpperCase()}</span>
                      {rule.targetContact && <span>({rule.targetContact})</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        rule.active
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {rule.active ? 'Actif' : 'Pause'}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Historique des Opportunités Résolues */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Historique de Détection & Durée de Vie des Cotes
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Analyse de la persistance des arbitrages avant réajustement par les bookmakers.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {historyLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500">{log.competition}</span>
                      <h4 className="font-semibold text-white text-sm">{log.match}</h4>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400 text-sm">
                        +{log.yieldPercent}%
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.closedAt}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>Durée de fenêtre active : <strong className="text-slate-200">{log.durationMinutes} minutes</strong></span>
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {log.resolution}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
