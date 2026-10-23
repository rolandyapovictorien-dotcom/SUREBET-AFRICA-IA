import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Server,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { DataSourceMode, ApiFootballDiagnostic, TheOddsApiDiagnostic } from '../types/surebet';

interface DemoDisclaimerBannerProps {
  dataSourceMode: DataSourceMode;
  onToggleMode: (mode: DataSourceMode) => void;
  diagnostic?: ApiFootballDiagnostic | TheOddsApiDiagnostic | null;
  onNavigateToSources?: () => void;
}

export const DemoDisclaimerBanner: React.FC<DemoDisclaimerBannerProps> = ({
  dataSourceMode,
  onToggleMode,
  diagnostic,
  onNavigateToSources,
}) => {
  const [expanded, setExpanded] = useState(false);

  const isTheOddsApi = dataSourceMode === 'the_odds_api';
  const isApiFootball = dataSourceMode === 'real_api_football';
  const isConnected = diagnostic?.connectionState === 'connected';

  return (
    <div
      className={`border-b px-4 py-2.5 text-xs transition-colors ${
        isTheOddsApi
          ? 'border-cyan-500/20 bg-cyan-500/5 text-cyan-200/90'
          : isApiFootball
          ? isConnected
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200/90'
            : 'border-amber-500/20 bg-amber-500/5 text-amber-200/90'
          : 'border-amber-500/20 bg-amber-500/5 text-amber-200/90'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {isTheOddsApi ? (
            <>
              <span className="font-mono font-bold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 shrink-0">
                DONNÉES RÉELLES (THE ODDS API V4)
              </span>
              <span className="text-slate-500 hidden md:inline">·</span>
              <p className="text-slate-300 leading-tight">
                {(diagnostic as any)?.requestsRemaining !== undefined
                  ? `Flux multi-sports connecté. Quota : ${(diagnostic as any).requestsRemaining} req. restantes. Cache 300s.`
                  : 'Flux de cotes multi-sports officiel The Odds API V4 connecté.'}
              </p>
            </>
          ) : isApiFootball ? (
            <>
              <span className={`font-mono font-bold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded border shrink-0 ${
                isConnected
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}>
                DONNÉES RÉELLES (API-FOOTBALL)
              </span>
              <span className="text-slate-500 hidden md:inline">·</span>
              <p className="text-slate-300 leading-tight">
                {isConnected
                  ? `Flux de cotes pré-match actif. Quota : ${(diagnostic as any)?.requestsUsedToday ?? 0}/${(diagnostic as any)?.dailyLimit ?? 100} req. utilisées. Cache 180s actif.`
                  : 'Mode réel sélectionné : clé serveur APISPORTS_KEY non connectée. Le simulateur reste en attente de configuration.'}
              </p>
            </>
          ) : (
            <>
              <span className="font-mono font-bold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/20 text-amber-300 shrink-0">
                DÉMONSTRATION DÉTERMINISTE
              </span>
              <span className="text-amber-300/40 hidden md:inline">·</span>
              <p className="text-amber-200/80 leading-tight">
                Cotes et opportunités générées mathématiquement pour tester le moteur d'arbitrage S &lt; 1 et les arrondis FCFA.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
          {isApiFootball && !isConnected && onNavigateToSources && (
            <button
              onClick={onNavigateToSources}
              className="text-[11px] font-medium text-amber-300 hover:text-white underline underline-offset-2 flex items-center gap-1"
            >
              <span>Configurer la clé</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}

          <button
            onClick={() => onToggleMode(dataSourceMode === 'the_odds_api' ? 'demo' : 'the_odds_api')}
            className={`text-[11px] font-medium px-2 py-0.5 rounded border transition-colors ${
              isTheOddsApi
                ? 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                : 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10'
            }`}
          >
            {isTheOddsApi ? 'Passer en Démonstration' : 'Basculer The Odds API'}
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap"
          >
            <span>{expanded ? 'Masquer règles' : 'Règles & risques'}</span>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300">
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-300">1. Détection des erreurs manifestes (Palpable Error)</h4>
            <p className="text-slate-400 leading-relaxed">
              Un bookmaker qui inverse ses cotes (ex: 10.0 au lieu de 1.10) annulera unilatéralement le pari a posteriori. Notre moteur filtre ou signale toute opportunité anormale (&gt; 15%).
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-300">2. Risque de fluctuation des cotes réelles</h4>
            <p className="text-slate-400 leading-relaxed">
              Sur les flux réels d'API-Football, les bookmakers ajustent leurs cotes en permanence. Entre la première mise chez un bookmaker et la seconde, la cote peut chuter.
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-300">3. Conformité & Régulation en Afrique</h4>
            <p className="text-slate-400 leading-relaxed">
              Vérifiez le statut réglementaire de chaque opérateur en Afrique de l'Ouest (ex: LONACI pour Sportcash en Côte d'Ivoire). Aucune prise de pari n'est automatisée.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
