import React from 'react';
import {
  TrendingUp,
  Zap,
  Activity,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Calculator,
  Compass,
} from 'lucide-react';
import { SurebetOpportunity, Sport, DataSourceMode, ApiFootballDiagnostic } from '../types/surebet';
import { formatFcfa, formatPercent, formatFreshness, formatMatchTime } from '../utils/formatters';

interface DashboardPageProps {
  opportunities: SurebetOpportunity[];
  sports: Sport[];
  lastSyncTime: string;
  defaultStake: number;
  onNavigate: (page: 'dashboard' | 'scanner' | 'calculator' | 'sources' | 'sports' | 'history' | 'settings') => void;
  onSelectSurebetForCalculator: (surebet: SurebetOpportunity) => void;
  dataSourceMode: DataSourceMode;
  onToggleDataSourceMode: (mode: DataSourceMode) => void;
  diagnostic?: ApiFootballDiagnostic | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  opportunities,
  sports,
  lastSyncTime,
  defaultStake,
  onNavigate,
  onSelectSurebetForCalculator,
  dataSourceMode,
  onToggleDataSourceMode,
  diagnostic,
}) => {
  const activeCount = opportunities.length;
  const liveCount = opportunities.filter((o) => o.isLive).length;
  const avgYield =
    activeCount > 0
      ? opportunities.reduce((acc, curr) => acc + curr.theoreticalYieldPercent, 0) / activeCount
      : 0;

  const topOpportunities = [...opportunities]
    .sort((a, b) => b.theoreticalYieldPercent - a.theoreticalYieldPercent)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Kicker et Titre */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>SaaS Arbitrage Sportif</span>
            <span aria-hidden="true">·</span>
            <span>Afrique de l'Ouest & Centrale</span>
            <span aria-hidden="true">·</span>
            <span>Dernière synchro : {lastSyncTime}</span>
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-white font-display">
            Tableau de Bord
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Aperçu en temps réel des opportunités théoriques détectées et du moteur d'arbitrage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('scanner')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap shadow-sm"
          >
            <Compass className="h-4 w-4" />
            <span>Ouvrir le Scanner</span>
          </button>
          <button
            onClick={() => onNavigate('calculator')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Calculator className="h-4 w-4" />
            <span>Calculateur Libre</span>
          </button>
        </div>
      </div>

      {/* Cartes KPI statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Opportunités Actives</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold font-mono text-white tabular-nums">
            {activeCount}
          </div>
          <div className="text-[11px] text-slate-400">
            {liveCount > 0 ? `${liveCount} en direct (Live)` : 'Toutes en pré-match'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Rendement Moyen</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold font-mono text-emerald-400 tabular-nums">
            {formatPercent(avgYield)}
          </div>
          <div className="text-[11px] text-slate-400">Gain théorique par arbitrage</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mise de Référence</span>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-xl md:text-2xl font-bold font-mono text-white tabular-nums">
            {formatFcfa(defaultStake)}
          </div>
          <div className="text-[11px] text-slate-400">Configurable dans Paramètres</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Statut du Moteur</span>
            <Clock className={`h-4 w-4 ${dataSourceMode === 'the_odds_api' ? 'text-cyan-400' : dataSourceMode === 'real_api_football' ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className={`text-xs md:text-sm font-bold font-mono mt-1 ${
            dataSourceMode === 'the_odds_api'
              ? 'text-cyan-400'
              : dataSourceMode === 'real_api_football'
              ? diagnostic?.connectionState === 'connected'
                ? 'text-emerald-400'
                : 'text-amber-400'
              : 'text-amber-400'
          }`}>
            {dataSourceMode === 'the_odds_api'
              ? 'The Odds API V4 (Réel)'
              : dataSourceMode === 'real_api_football'
              ? diagnostic?.connectionState === 'connected'
                ? 'Données Réelles API-Football'
                : 'API-Football (Attente Clé)'
              : 'Mode Démo Déterministe'}
          </div>
          <div className="text-[10px] text-slate-400">
            {dataSourceMode === 'the_odds_api'
              ? 'Flux api.the-odds-api.com/v4'
              : dataSourceMode === 'real_api_football'
              ? 'Flux v3.football.api-sports.io'
              : 'Données fictives étiquetées'}
          </div>
        </div>
      </div>

      {/* Top 3 des opportunités du moment */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white font-display">
              Meilleures Opportunités d'Arbitrage (Top Rendements)
            </h2>
            <p className="text-xs text-slate-400">
              {dataSourceMode === 'the_odds_api'
                ? 'Opportunités identifiées sur les flux réels multi-sports The Odds API V4.'
                : dataSourceMode === 'real_api_football'
                ? 'Opportunités identifiées sur les flux réels API-Football.'
                : 'Chaque ligne ci-dessous est étiquetée « DÉMONSTRATION — NON VÉRIFIÉE » conformément aux règles de fiabilité.'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('scanner')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Voir le scanner ({activeCount})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {activeCount === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 text-center text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-300">
              {dataSourceMode === 'the_odds_api'
                ? 'Cotes réelles scannées depuis The Odds API V4. Aucune opportunité d\'arbitrage (S < 1) parmi les marchés analysés (les cotes de marché sont actuellement équilibrées).'
                : dataSourceMode === 'real_api_football'
                ? 'Aucune opportunité d\'arbitrage détectée sur les cotes réelles analysées (les bookmakers ajustent rapidement leurs marges).'
                : 'Aucune opportunité dans la file actuelle.'}
            </p>
            <div className="flex justify-center gap-2 pt-1">
              {(dataSourceMode === 'real_api_football' || dataSourceMode === 'the_odds_api') && (
                <button
                  onClick={() => onToggleDataSourceMode('demo')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold"
                >
                  Basculer en Mode Démo pour explorer
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all"
              >
                <div className="space-y-2">
                  {/* Étiquette explicite requise */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    {opp.isDemoData ? (
                      <span className="text-[10px] font-mono font-bold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        DÉMONSTRATION — NON VÉRIFIÉE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                        DONNÉES RÉELLES (API-FOOTBALL)
                      </span>
                    )}
                    <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                      {formatPercent(opp.theoreticalYieldPercent)}
                    </span>
                  </div>

                <div>
                  <div className="text-[11px] text-slate-500">{opp.competition}</div>
                  <h3 className="font-bold text-white text-sm mt-0.5 line-clamp-1">
                    {opp.homeTeam} vs {opp.awayTeam}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Marché : <span className="text-slate-300">{opp.marketLabel}</span>
                  </div>
                </div>

                {/* Résumé des issues et bookmakers */}
                <div className="space-y-1 pt-1 text-xs font-mono">
                  {opp.outcomes.map((o, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800/60"
                    >
                      <span className="font-sans truncate text-slate-400">{o.label}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-400 text-[10px]">{o.bookmakerName}</span>
                        <span className="font-bold text-emerald-400 tabular-nums">
                          {o.odd.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectSurebetForCalculator(opp);
                  onNavigate('calculator');
                }}
                className="w-full mt-2 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>Calculer en FCFA</span>
              </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grille Couverture des Sports & Fonctionnement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Couverture par sport */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-display">
              Sports Analysés en Phase 1
            </h2>
            <button
              onClick={() => onNavigate('sports')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Détails de couverture →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {sports.slice(0, 9).map((s) => (
              <div
                key={s.id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <span>{s.icon}</span>
                  <span className="text-slate-300 truncate">{s.name}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">
                  {s.activeMatchesCount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rappel des principes mathématiques */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <h2 className="text-sm font-bold text-white font-display">
            Formule & Déterminisme Mathématique
          </h2>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 space-y-1">
            <div className="text-emerald-400 font-bold">S = ∑ (1 / Cote_i)</div>
            <div className="text-slate-400 text-[11px]">
              Arbitrage si S &lt; 1.0000 · Rendement = (1/S - 1) × 100%
            </div>
            <div className="text-slate-400 text-[11px]">
              Mise_i = Budget × ((1 / Cote_i) / S) · Arrondi en FCFA
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Le moteur déterministe teste en continu l'ensemble des marchés compatibles (1X2, Face-à-Face, Plus/Moins de buts) et réajuste immédiatement les retours nets garantis après application des arrondis monétaires en FCFA.
          </p>
        </div>
      </div>
    </div>
  );
};
