import React, { useState } from 'react';
import {
  Sliders,
  Volume2,
  Globe,
  Coins,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Server,
  Layers,
} from 'lucide-react';
import { RoundingMode, UserSettings } from '../types/surebet';
import { formatFcfa } from '../utils/formatters';

interface SettingsPageProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [defaultStake, setDefaultStake] = useState<number>(settings.defaultStake);
  const [minYield, setMinYield] = useState<number>(settings.minYieldThreshold);
  const [maxFreshness, setMaxFreshness] = useState<number>(settings.maxFreshnessMinutes);
  const [roundingMode, setRoundingMode] = useState<RoundingMode>(settings.roundingMode);
  const [timezone, setTimezone] = useState<string>(settings.timezone);
  const [audioAlerts, setAudioAlerts] = useState<boolean>(settings.audioAlertsEnabled);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const timezones = [
    { id: 'Africa/Abidjan', label: 'Abidjan (UTC+0 · Côte d\'Ivoire)' },
    { id: 'Africa/Dakar', label: 'Dakar (UTC+0 · Sénégal)' },
    { id: 'Africa/Douala', label: 'Douala / Yaoundé (UTC+1 · Cameroun)' },
    { id: 'Africa/Kinshasa', label: 'Kinshasa (UTC+1 · RDC)' },
    { id: 'Africa/Lagos', label: 'Lagos (UTC+1 · Nigéria)' },
    { id: 'Europe/Paris', label: 'Paris (UTC+1/2 · France)' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      defaultStake,
      minYieldThreshold: minYield,
      maxFreshnessMinutes: maxFreshness,
      roundingMode,
      timezone,
      audioAlertsEnabled: audioAlerts,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const playTestBeep = () => {
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
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Préférences & Moteur</span>
            <span aria-hidden="true">·</span>
            <span>Mises en FCFA</span>
            <span aria-hidden="true">·</span>
            <span>Seuils de Tolérance</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white font-display">
            Paramètres Généraux
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Ajustez votre budget par défaut, le seuil de rendement minimal et les règles d'arrondi.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold animate-fade-in self-start md:self-auto">
            <CheckCircle2 className="h-4 w-4" />
            <span>Paramètres enregistrés avec succès</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1 : Budget & Arrondi */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Coins className="h-4 w-4 text-emerald-400" />
              <span>Capital & Règles d'Arrondi (FCFA)</span>
            </h2>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Mise de référence par défaut
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5000"
                  step="5000"
                  value={defaultStake}
                  onChange={(e) => setDefaultStake(Math.max(1000, Number(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-slate-500">
                  FCFA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Ce montant sera pré-rempli automatiquement lors de l'ouverture du calculateur.
              </p>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">
                Pas d'arrondi préféré
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(
                  [
                    { id: 'none', label: 'Au franc', desc: 'Exact' },
                    { id: '100', label: '100 FCFA', desc: 'Standard' },
                    { id: '500', label: '500 FCFA', desc: 'Recommandé' },
                    { id: '1000', label: '1 000 FCFA', desc: 'Sécurisé' },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoundingMode(r.id)}
                    className={`p-2 text-center rounded border transition-colors ${
                      roundingMode === r.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs">{r.label}</div>
                    <div className="text-[10px] text-slate-500">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2 : Seuils de Détection */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>Seuils du Scanner & Fraîcheur</span>
            </h2>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400">Rendement minimal déclencheur</label>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  &gt; {minYield.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.5"
                value={minYield}
                onChange={(e) => setMinYield(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Les opportunités dont le rendement est inférieur à ce seuil seront masquées par défaut.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400">
                  Seuil de fraîcheur maximale autorisée
                </label>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  &lt; {maxFreshness} min
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={maxFreshness}
                onChange={(e) => setMaxFreshness(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Masque automatiquement les cotes n'ayant pas reçu de confirmation récente du bookmaker.
              </p>
            </div>
          </div>

          {/* Section 3 : Fuseau Horaire */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-400" />
              <span>Fuseau Horaire de Référence</span>
            </h2>

            <div className="space-y-1.5">
              {timezones.map((tz) => (
                <button
                  key={tz.id}
                  type="button"
                  onClick={() => setTimezone(tz.id)}
                  className={`w-full p-2.5 text-left rounded-lg border text-xs transition-colors ${
                    timezone === tz.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-white font-medium'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {tz.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4 : Alertes Sonores & Notifications */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-emerald-400" />
              <span>Signaux & Notifications</span>
            </h2>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <div className="text-xs font-semibold text-white">Signal Sonore d'Arbitrage</div>
                <div className="text-[11px] text-slate-400">
                  Bip audio instantané (880 Hz) dès qu'un surebet dépasse votre seuil.
                </div>
              </div>
              <input
                type="checkbox"
                checked={audioAlerts}
                onChange={(e) => setAudioAlerts(e.target.checked)}
                className="h-4 w-4 accent-emerald-500 rounded"
              />
            </div>

            <button
              type="button"
              onClick={playTestBeep}
              className="w-full py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Tester le signal audio</span>
            </button>
          </div>
        </div>

        {/* Bouton Enregistrer */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors shadow-sm"
          >
            Enregistrer mes préférences
          </button>
        </div>
      </form>

      {/* Note d'architecture pour la suite */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-2 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-white font-semibold">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Architecture Prête pour Connexion d'API Sportive Réelle (Phase 2)</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Le patron de conception <strong>Adapter Pattern</strong> (`IOddsProvider`) est déjà intégré côté serveur. Lorsque vous disposerez d'une clé d'API sportive officielle (ex: The Odds API, BetsAPI ou Sportmonks), il suffira de l'ajouter dans les variables d'environnement du serveur sans modifier le moteur de calcul mathématique ni le calculateur FCFA.
        </p>
      </div>
    </div>
  );
};
