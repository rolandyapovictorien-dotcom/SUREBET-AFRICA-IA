import React, { useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  Clock,
  ArrowRight,
  Radio,
  Layers,
  Sparkles,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Sport, SportId } from '../types/surebet';

interface SportsPageProps {
  sports: Sport[];
  onSelectSport: (sportId: SportId) => void;
}

export const SportsPage: React.FC<SportsPageProps> = ({ sports, onSelectSport }) => {
  const [filterType, setFilterType] = useState<'all' | 'active' | 'planned'>('all');

  const filteredSports = sports.filter((s) => {
    if (filterType === 'active') return s.status === 'active_demo';
    if (filterType === 'planned') return s.status === 'planned_integration';
    return true;
  });

  const activeCount = sports.filter((s) => s.status === 'active_demo').length;
  const plannedCount = sports.filter((s) => s.status === 'planned_integration').length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Catalogue Multi-Disciplines</span>
            <span aria-hidden="true">·</span>
            <span>Pré-Match & Live</span>
            <span aria-hidden="true">·</span>
            <span>Marchés Compatibles</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white font-display">
            Couverture des Sports & Marchés
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Sports actifs en Phase 1 et disciplines programmées pour les futures intégrations d'API.
          </p>
        </div>

        {/* Filtre d'affichage */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              filterType === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tous ({sports.length})
          </button>
          <button
            onClick={() => setFilterType('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              filterType === 'active'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Actifs en Démo ({activeCount})
          </button>
          <button
            onClick={() => setFilterType('planned')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              filterType === 'planned'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Futurs Connecteurs ({plannedCount})
          </button>
        </div>
      </div>

      {/* Grille des sports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSports.map((sport) => {
          const isActive = sport.status === 'active_demo';

          return (
            <div
              key={sport.id}
              className={`rounded-xl border p-5 flex flex-col justify-between space-y-4 transition-all ${
                isActive
                  ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  : 'border-slate-800/40 bg-slate-950/40 opacity-75'
              }`}
            >
              <div className="space-y-3">
                {/* Icône et nom */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{sport.icon}</span>
                    <div>
                      <h3 className="font-bold text-white text-base font-display">{sport.name}</h3>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {isActive
                          ? `${sport.activeMatchesCount} événements analysés`
                          : 'Prochaine intégration API'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isActive ? 'ACTIF (DÉMO)' : 'PRÉVU'}
                  </span>
                </div>

                {/* Statut Pré-match et Live */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Pré-match :</span>
                    <span
                      className={`font-semibold text-[11px] ${
                        sport.preMatchAvailable ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {sport.preMatchAvailable ? 'Disponible' : 'Inactif'}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">En direct :</span>
                    <span
                      className={`font-semibold text-[11px] ${
                        sport.liveAvailable ? 'text-rose-400' : 'text-slate-500'
                      }`}
                    >
                      {sport.liveAvailable ? 'Disponible' : 'Inactif'}
                    </span>
                  </div>
                </div>

                {/* Marchés compatibles */}
                <div>
                  <div className="text-[11px] text-slate-400 font-medium mb-1.5">
                    Marchés d'arbitrage compatibles :
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sport.marketsSupported.map((m, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* État Fournisseur Réel vs Démo */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-400">
                    {sport.realProviderSupported ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Supporté en mode réel (API-Football pré-match)</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Info className="h-3 w-3 text-slate-500" />
                        <span>{sport.realProviderNote || 'Non couvert par API-Football · Disponible en Démo'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isActive ? (
                <button
                  onClick={() => onSelectSport(sport.id)}
                  className="w-full mt-2 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Filtrer le scanner sur ce sport</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              ) : (
                <div className="w-full py-2 text-center text-[11px] text-slate-500 bg-slate-950 rounded border border-slate-800">
                  Connecteur d'API prévu
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
