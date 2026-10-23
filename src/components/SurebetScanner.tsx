import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Clock,
  ExternalLink,
  Calculator,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
  Radio,
  SlidersHorizontal,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { SportId, SurebetOpportunity, Sport } from '../types/surebet';
import { formatFcfa, formatPercent, formatFreshness, formatMatchTime } from '../utils/formatters';

interface SurebetScannerProps {
  onOpenCalculatorWithSurebet: (surebet: SurebetOpportunity) => void;
  favorites: string[];
  onToggleFavorite: (surebetId: string) => void;
}

export const SurebetScanner: React.FC<SurebetScannerProps> = ({
  onOpenCalculatorWithSurebet,
  favorites,
  onToggleFavorite,
}) => {
  const [opportunities, setOpportunities] = useState<SurebetOpportunity[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filtres
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'prematch' | 'live'>('all');
  const [minYield, setMinYield] = useState<number>(0.5);
  const [maxYield, setMaxYield] = useState<number>(15.0);
  const [selectedBookmaker, setSelectedBookmaker] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('fr-FR'));

  const fetchOpportunities = async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (selectedSport !== 'all') params.append('sport', selectedSport);
      if (modeFilter === 'live') params.append('live', 'true');
      if (modeFilter === 'prematch') params.append('live', 'false');
      if (minYield > 0) params.append('minYield', minYield.toString());
      if (maxYield < 20) params.append('maxYield', maxYield.toString());
      if (selectedBookmaker !== 'all') params.append('bookmaker', selectedBookmaker);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/arbitrage/opportunities?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.opportunities)) {
          setOpportunities(data.opportunities);
        }
      }
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    } catch (err: any) {
      console.warn('Information scanner opportunités:', err?.message || err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchSports = async () => {
    try {
      const res = await fetch('/api/sports');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSports(data);
        }
      }
    } catch (err: any) {
      console.warn('Information scanner sports:', err?.message || err);
    }
  };

  useEffect(() => {
    fetchSports();
    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 25000); // Actualisation automatique
    return () => clearInterval(interval);
  }, [selectedSport, modeFilter, minYield, maxYield, selectedBookmaker, searchQuery]);

  // Statistiques rapides
  const totalArbs = opportunities.length;
  const avgYield =
    totalArbs > 0
      ? opportunities.reduce((acc, curr) => acc + curr.theoreticalYieldPercent, 0) / totalArbs
      : 0;

  return (
    <div className="space-y-6">
      {/* En-tête et métriques globales */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Scanner Haute Fréquence</span>
            <span aria-hidden="true">·</span>
            <span>Dernière synchro : {lastSyncTime}</span>
            <span aria-hidden="true">·</span>
            <span>Afrique de l'Ouest & International</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white font-display">
            Scanner d'Arbitrage Multi-Sports (Surebets)
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOpportunities}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Actualiser le scan</span>
          </button>
        </div>
      </div>

      {/* Bandeau KPI / Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400">Opportunités Détectées</div>
          <div className="mt-1 text-2xl font-bold font-mono text-white tabular-nums">
            {totalArbs}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400">Prêtes à être calculées</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400">Rendement Moyen</div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {formatPercent(avgYield)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Gain théorique par arbitrage</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400">Modes Disponibles</div>
          <div className="mt-1 text-2xl font-bold font-mono text-white tabular-nums">
            Pré-match & Live
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Selon disponibilité des cotes</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400">Fraîcheur des Données</div>
          <div className="mt-1 text-2xl font-bold font-mono text-cyan-400 tabular-nums">
            &lt; 45s
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Mode Démo Déterministe</div>
        </div>
      </div>

      {/* Barre de filtres interactive */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
        {/* Ligne 1: Modes et Recherche */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Segmented Control pour Modes */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setModeFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                modeFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous les Modes
            </button>
            <button
              onClick={() => setModeFilter('prematch')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                modeFilter === 'prematch'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pré-Match Uniquement
            </button>
            <button
              onClick={() => setModeFilter('live')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                modeFilter === 'live'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              En Direct (Live)
            </button>
          </div>

          {/* Recherche textuelle */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher club, joueur, compétition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Ligne 2: Sélecteur de Sports (Boutons horizontaux) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSport('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg border whitespace-nowrap transition-colors ${
              selectedSport === 'all'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            Tous les Sports
          </button>
          {sports.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSport(s.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedSport === s.id
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>

        {/* Ligne 3: Filtre de Rendement (%) et Bookmakers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="shrink-0">Rendement minimum :</span>
            <input
              type="range"
              min="0.5"
              max="10.0"
              step="0.5"
              value={minYield}
              onChange={(e) => setMinYield(parseFloat(e.target.value))}
              className="w-32 accent-emerald-500"
            />
            <span className="font-mono font-bold text-emerald-400 tabular-nums">
              &gt; {minYield.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Bookmaker :</span>
            <select
              value={selectedBookmaker}
              onChange={(e) => setSelectedBookmaker(e.target.value)}
              className="rounded border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">Tous les bookmakers</option>
              <option value="sportcash">Sportcash (LONACI CI)</option>
              <option value="1xbet">1xBet CI</option>
              <option value="premierbet">Premier Bet CI</option>
              <option value="betclic">Betclic</option>
              <option value="betway">Betway Africa</option>
              <option value="betwinner">Betwinner</option>
              <option value="melbet">Melbet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des Opportunités de Surebet */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
          <p className="text-sm">Scan des marchés et calcul des inverses...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center">
          <p className="text-sm text-slate-300">Aucune opportunité ne correspond à vos filtres actuels.</p>
          <p className="text-xs text-slate-500 mt-1">
            Essayez de baisser le rendement minimum ou de réinitialiser le filtre de sport.
          </p>
          <button
            onClick={() => {
              setSelectedSport('all');
              setMinYield(0.5);
              setSelectedBookmaker('all');
              setSearchQuery('');
              setModeFilter('all');
            }}
            className="mt-4 px-4 py-2 text-xs font-medium text-slate-900 bg-white rounded-lg hover:bg-slate-200 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((item) => {
            const isFav = favorites.includes(item.id);

            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:p-5 transition-all hover:border-slate-700 space-y-4"
              >
                {/* Header de la carte : Métadonnées sans pilules */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                    <span className="font-medium text-slate-300">{item.competition}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.sportName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {item.isLive ? (
                        <span className="text-rose-400 font-semibold">
                          EN DIRECT ({item.liveMinute || 'Live'}) {item.liveScore ? `· ${item.liveScore}` : ''}
                        </span>
                      ) : (
                        <span>Coup d'envoi {formatMatchTime(item.startTime)}</span>
                      )}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {formatFreshness(item.freshnessSeconds)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className={`text-slate-400 hover:text-amber-400 transition-colors ${
                        isFav ? 'text-amber-400' : ''
                      }`}
                      title={isFav ? 'Retirer des favoris' : 'Enregistrer en favori'}
                    >
                      {isFav ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </button>

                    {/* Rendement affiché de manière nette sans pilule colorée criarde */}
                    <div className="text-right">
                      <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                        {formatPercent(item.theoreticalYieldPercent)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        S = {item.sumOfInverses.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Titre du match et marché */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">
                      {item.homeTeam} <span className="text-slate-500 font-normal">vs</span> {item.awayTeam}
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Marché : <span className="text-slate-200">{item.marketLabel}</span>
                    </div>
                  </div>

                  {item.riskLevel === 'ALERTE_ERREUR_PALP' && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Risque d'erreur de cote bookmaker (Palpable Error)</span>
                    </div>
                  )}
                </div>

                {/* Grille des cotes d'arbitrage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {item.outcomes.map((outcome, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {outcome.label}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>{outcome.bookmakerName}</span>
                          {outcome.officialUrl && (
                            <a
                              href={outcome.officialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-slate-300"
                              title="Accéder au site officiel"
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                          {outcome.odd.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          inv: {(1 / outcome.odd).toFixed(3)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions de bas de carte */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Répartition optimale calculable en FCFA
                  </span>

                  <button
                    onClick={() => onOpenCalculatorWithSurebet(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors font-medium"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    <span>Calculer les mises FCFA</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
