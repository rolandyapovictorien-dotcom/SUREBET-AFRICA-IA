import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Clock,
  Calculator,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Server,
  Zap,
  Info,
  ArrowRight,
  ShieldCheck,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  XCircle,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';
import {
  SportId,
  SurebetOpportunity,
  Sport,
  DataSourceMode,
  ApiFootballDiagnostic,
  MarketType,
  ScannerStats,
  RejectedEventSummary,
} from '../types/surebet';
import { formatPercent, formatFreshness, formatMatchTime } from '../utils/formatters';

interface ScannerPageProps {
  opportunities: SurebetOpportunity[];
  sports: Sport[];
  loading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenCalculator: (surebet: SurebetOpportunity) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  minYieldFilter: number;
  maxFreshnessMinutes: number;
  dataSourceMode: DataSourceMode;
  onToggleDataSourceMode: (mode: DataSourceMode) => void;
  diagnostic?: ApiFootballDiagnostic | null;
  stats?: ScannerStats | null;
  rejectedEvents?: RejectedEventSummary[];
  onNavigateToSources?: () => void;
}

export const ScannerPage: React.FC<ScannerPageProps> = ({
  opportunities,
  sports,
  loading,
  isRefreshing,
  onRefresh,
  onOpenCalculator,
  favorites,
  onToggleFavorite,
  minYieldFilter,
  maxFreshnessMinutes,
  dataSourceMode,
  onToggleDataSourceMode,
  diagnostic,
  stats,
  rejectedEvents = [],
  onNavigateToSources,
}) => {
  // Filtres fonctionnels
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'prematch' | 'live'>('all');
  const [minYield, setMinYield] = useState<number>(minYieldFilter || 0.5);
  const [selectedBookmaker, setSelectedBookmaker] = useState<string>('all');
  const [freshnessThreshold, setFreshnessThreshold] = useState<number>(maxFreshnessMinutes || 30);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showExpired, setShowExpired] = useState<boolean>(false);

  // Panneau d'audit et rejets
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);
  const [auditReasonFilter, setAuditReasonFilter] = useState<string>('all');

  // Cooldown anti-spam sur le rafraîchissement manuel (5s)
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleManualRefresh = () => {
    if (cooldownSeconds > 0 || isRefreshing || loading) return;
    setCooldownSeconds(5);
    onRefresh();
  };

  const isTheOddsApi = dataSourceMode === 'the_odds_api';
  const isApiFootball = dataSourceMode === 'real_api_football';
  const isReal = isTheOddsApi || isApiFootball;
  const isConnected = diagnostic?.connectionState === 'connected';

  // Liste unique des compétitions disponibles dans les résultats chargés
  const availableCompetitions = Array.from(
    new Set(opportunities.map((o) => o.competition))
  ).filter(Boolean);

  // Filtrage fonctionnel strict
  const filteredOpportunities = opportunities.filter((item) => {
    // 1. Sport
    if (selectedSport !== 'all' && item.sportId !== selectedSport) return false;

    // 2. Compétition
    if (selectedCompetition !== 'all' && item.competition !== selectedCompetition) return false;

    // 3. Marché
    if (selectedMarket !== 'all' && item.marketType !== selectedMarket) return false;

    // 4. Pré-match vs Direct
    if (modeFilter === 'prematch' && item.isLive) return false;
    if (modeFilter === 'live' && !item.isLive) return false;

    // 5. Seuil de rendement théorique
    if (item.theoreticalYieldPercent < minYield) return false;

    // 6. Bookmaker
    if (
      selectedBookmaker !== 'all' &&
      !item.outcomes.some((o) => o.bookmakerId === selectedBookmaker)
    ) {
      return false;
    }

    // 7. Seuil de fraîcheur
    const ageMinutes = Math.floor((item.freshnessSeconds || 0) / 60);
    const isItemExpired = ageMinutes > freshnessThreshold;
    if (!showExpired && isItemExpired) return false;

    // 8. Recherche textuelle
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchText = `${item.homeTeam} ${item.awayTeam} ${item.competition}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  // Rejets filtrés par motif
  const filteredRejections = rejectedEvents.filter((r) => {
    if (selectedSport !== 'all' && r.sportId !== selectedSport) return false;
    if (auditReasonFilter !== 'all' && r.reasonCode !== auditReasonFilter) return false;
    return true;
  });

  // Sport non supporté en mode réel
  const theOddsApiSportsList = ['football', 'basketball', 'tennis', 'baseball', 'hockey', 'rugby', 'cricket', 'mma', 'boxing'];
  const isSelectedSportUnsupportedInReal =
    (isApiFootball && selectedSport !== 'all' && selectedSport !== 'football') ||
    (isTheOddsApi && selectedSport !== 'all' && !theOddsApiSportsList.includes(selectedSport));

  return (
    <div className="space-y-6">
      {/* EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Scanner Intelligent Multi-Sport</span>
            <span aria-hidden="true">·</span>
            <span>Afrique & International</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-400">Moteur Mathématique S &lt; 1</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white font-display">
            Scanner d'Arbitrage & Cotes Comparées
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {isTheOddsApi
              ? 'Analyse en direct des cotes réelles multi-sports The Odds API V4. Seules les opportunités réelles S < 1 sont retenues.'
              : isApiFootball
              ? 'Analyse en temps réel des cotes pré-match réelles issues d\'API-Football. Marge de sécurité et validation stricte.'
              : 'Données de simulation mathématique déterministes. Chaque ligne est étiquetée « DÉMONSTRATION — NON VÉRIFIÉE ».'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sélecteur de Source Hybride */}
          <div className="flex items-center p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => onToggleDataSourceMode('demo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                !isReal
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${!isReal ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
              <span>DÉMO</span>
            </button>
            <button
              onClick={() => onToggleDataSourceMode('the_odds_api')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                isTheOddsApi
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isTheOddsApi ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                }`}
              ></span>
              <span>THE ODDS API</span>
            </button>
            <button
              onClick={() => onToggleDataSourceMode('real_api_football')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                isApiFootball
                  ? isConnected
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isApiFootball
                    ? isConnected
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-amber-400'
                    : 'bg-slate-600'
                }`}
              ></span>
              <span>API-FOOTBALL</span>
            </button>
          </div>

          {/* Bouton de rafraîchissement avec cooldown anti-spam */}
          <button
            onClick={handleManualRefresh}
            disabled={cooldownSeconds > 0 || isRefreshing || loading}
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              cooldownSeconds > 0
                ? 'border-slate-800 bg-slate-950 text-slate-500 cursor-not-allowed'
                : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
            }`}
            title={cooldownSeconds > 0 ? `Attente de protection ${cooldownSeconds}s` : 'Actualiser les cotes'}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isRefreshing ? 'animate-spin text-emerald-400' : cooldownSeconds > 0 ? 'text-slate-600' : 'text-slate-400'
              }`}
            />
            <span>
              {cooldownSeconds > 0
                ? `Patienter (${cooldownSeconds}s)`
                : isRefreshing
                ? 'Scan en cours...'
                : 'Actualiser le flux'}
            </span>
          </button>
        </div>
      </div>

      {/* AVERTISSEMENT SI CLÉ RÉELLE NON CONFIGURÉE */}
      {isReal && !isConnected && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Clé APISPORTS_KEY non connectée côté serveur</span>
            </div>
            {onNavigateToSources && (
              <button
                onClick={onNavigateToSources}
                className="font-medium text-amber-300 underline underline-offset-2 hover:text-white flex items-center gap-1"
              >
                <span>Consulter la page Sources de cotes</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
          <p className="text-slate-300 leading-relaxed">
            Pour analyser les cotes réelles du football pré-match (Premier League, Ligue 1, etc.), configurez votre clé API gratuite ou premium dans les Secrets AI Studio sous le nom <code>APISPORTS_KEY</code>.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onToggleDataSourceMode('demo')}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-semibold text-[11px] border border-amber-500/40"
            >
              Basculer en Mode Démonstration pour tester le moteur
            </button>
          </div>
        </div>
      )}

      {/* BANDEAU SI SPORT NON PRIS EN CHARGE PAR LE FOURNISSEUR RÉEL */}
      {isSelectedSportUnsupportedInReal && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Sport non disponible sur le fournisseur actuel</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              API-Football couvre exclusivement le football pré-match. Les cotes réelles pour ce sport ne sont pas encore intégrées.
            </p>
          </div>
          <button
            onClick={() => onToggleDataSourceMode('demo')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-semibold text-xs whitespace-nowrap self-start sm:self-auto"
          >
            Explorer ce sport en Mode Démo
          </button>
        </div>
      )}

      {/* BARRE DES FILTRES FONCTIONNELS */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
        {/* LIGNE 1 : Mode Pré-match / Live & Recherche */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setModeFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                modeFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous ({opportunities.length})
            </button>
            <button
              onClick={() => setModeFilter('prematch')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                modeFilter === 'prematch'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pré-Match ({opportunities.filter((o) => !o.isLive).length})
            </button>
            <button
              onClick={() => {
                if (isReal) return;
                setModeFilter('live');
              }}
              disabled={isReal}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                modeFilter === 'live'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : isReal
                  ? 'text-slate-600 cursor-not-allowed opacity-60'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={isReal ? 'API-Football pré-match ne couvre pas les flux en direct' : 'Événements en direct'}
            >
              <span>En Direct ({opportunities.filter((o) => o.isLive).length})</span>
              {isReal && <span className="text-[9px] bg-slate-900 px-1 rounded text-slate-500 font-mono">Pré-match seul</span>}
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher club, joueur, ligue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* LIGNE 2 : Filtre par Sport (Multi-Sport Extensible) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedSport('all')}
            className={`px-3 py-1.5 font-medium rounded-lg border whitespace-nowrap transition-colors ${
              selectedSport === 'all'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Tous les Sports
          </button>
          {sports.map((s) => {
            const isSupportedReal = s.id === 'football';

            return (
              <button
                key={s.id}
                onClick={() => setSelectedSport(s.id)}
                className={`px-3 py-1.5 font-medium rounded-lg border whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedSport === s.id
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.name}</span>
                {isReal && (
                  <span
                    className={`text-[9px] font-mono px-1 rounded ${
                      isSupportedReal
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isSupportedReal ? 'API' : 'Démo'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* LIGNE 3 : Filtres Avancés (Compétition, Marché, Bookmaker, Rendement, Fraîcheur) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 text-xs">
          {/* Compétition */}
          <div className="space-y-1">
            <label className="text-slate-400 block text-[11px]">Compétition</label>
            <select
              value={selectedCompetition}
              onChange={(e) => setSelectedCompetition(e.target.value)}
              className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">Toutes compétitions</option>
              {availableCompetitions.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>

          {/* Marché */}
          <div className="space-y-1">
            <label className="text-slate-400 block text-[11px]">Type de Marché</label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">Tous les marchés</option>
              <option value="1X2">1X2 · Temps Régulier (3 issues)</option>
              <option value="MONEYLINE_12">Face-à-Face / Moneyline (2 issues)</option>
              <option value="OVER_UNDER_2_5">Plus / Moins 2.5 Buts (2 issues)</option>
              <option value="BTTS">Les Deux Équipes Marquent (BTTS)</option>
            </select>
          </div>

          {/* Bookmaker */}
          <div className="space-y-1">
            <label className="text-slate-400 block text-[11px]">Bookmaker</label>
            <select
              value={selectedBookmaker}
              onChange={(e) => setSelectedBookmaker(e.target.value)}
              className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">Tous les bookmakers</option>
              <option value="sportcash">Sportcash CI (LONACI)</option>
              <option value="1xbet">1xBet CI</option>
              <option value="premierbet">Premier Bet CI</option>
              <option value="betclic">Betclic</option>
              <option value="betway">Betway Africa</option>
              <option value="betwinner">Betwinner</option>
              <option value="melbet">Melbet</option>
            </select>
          </div>

          {/* Rendement Minimal */}
          <div className="space-y-1">
            <label className="text-slate-400 block text-[11px]">Rendement Min.</label>
            <div className="flex items-center gap-1">
              {[0, 1.0, 2.0, 3.0, 5.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMinYield(val)}
                  className={`flex-1 py-1 rounded text-[11px] font-mono transition-colors ${
                    minYield === val
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  +{val}%
                </button>
              ))}
            </div>
          </div>

          {/* Seuil de Fraîcheur des Cotes */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <label className="text-slate-400">Âge Max Cotes</label>
              <span className="text-slate-300 font-mono">{freshnessThreshold} min</span>
            </div>
            <select
              value={freshnessThreshold}
              onChange={(e) => setFreshnessThreshold(Number(e.target.value))}
              className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
            >
              <option value={5}>5 minutes (Très frais)</option>
              <option value={15}>15 minutes (Standard)</option>
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes (1 heure)</option>
              <option value={1440}>Tout âge (sans exclusion)</option>
            </select>
          </div>
        </div>

        {/* Options secondaires */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showExpiredCheckbox"
              checked={showExpired}
              onChange={(e) => setShowExpired(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
            />
            <label htmlFor="showExpiredCheckbox" className="cursor-pointer text-slate-300">
              Afficher également les cotes périmées (&gt; {freshnessThreshold} min) avec marquage d'alerte
            </label>
          </div>

          <div className="text-slate-400 font-mono">
            {filteredOpportunities.length} opportunité(s) affichée(s)
          </div>
        </div>
      </div>

      {/* PANNEAU ACCORDÉON : AUDIT EN TEMPS RÉEL DU SCANNER & MOTIFS PRÉCIS DE REJET */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
        <button
          onClick={() => setIsAuditOpen(!isAuditOpen)}
          className="w-full p-4 flex items-center justify-between bg-slate-900/60 hover:bg-slate-900/80 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-white font-display">
                Événements Analysés & Motifs de Rejet du Scanner
              </span>
              <span className="ml-2 text-[11px] text-slate-400 font-mono">
                ({stats ? `${stats.totalScanned} analysés · ${stats.validArbitragesCount} surebets · ${stats.rejectedCount} rejetés` : 'Audit disponible'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{isAuditOpen ? 'Masquer le détail' : 'Inspecter les rejets'}</span>
            {isAuditOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {isAuditOpen && (
          <div className="p-4 border-t border-slate-800 space-y-4">
            {/* Grille des compteurs par motif */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
              <button
                onClick={() => setAuditReasonFilter('all')}
                className={`p-2 rounded border text-left transition-colors ${
                  auditReasonFilter === 'all'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[10px] text-slate-500 font-sans">Tous les rejets</div>
                <div className="text-lg font-bold text-white tabular-nums">
                  {stats?.rejectedCount || rejectedEvents.length}
                </div>
              </button>

              <button
                onClick={() => setAuditReasonFilter('INSUFFICIENT_BOOKMAKERS')}
                className={`p-2 rounded border text-left transition-colors ${
                  auditReasonFilter === 'INSUFFICIENT_BOOKMAKERS'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[10px] text-slate-500 font-sans">&lt; 2 Bookmakers</div>
                <div className="text-lg font-bold text-amber-400 tabular-nums">
                  {stats?.rejectedByReason?.INSUFFICIENT_BOOKMAKERS ?? 0}
                </div>
              </button>

              <button
                onClick={() => setAuditReasonFilter('INCOMPLETE_OUTCOMES')}
                className={`p-2 rounded border text-left transition-colors ${
                  auditReasonFilter === 'INCOMPLETE_OUTCOMES'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[10px] text-slate-500 font-sans">Issues Incomplètes</div>
                <div className="text-lg font-bold text-amber-400 tabular-nums">
                  {stats?.rejectedByReason?.INCOMPLETE_OUTCOMES ?? 0}
                </div>
              </button>

              <button
                onClick={() => setAuditReasonFilter('NO_ARBITRAGE')}
                className={`p-2 rounded border text-left transition-colors ${
                  auditReasonFilter === 'NO_ARBITRAGE'
                    ? 'border-slate-700 bg-slate-800 text-slate-200 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[10px] text-slate-500 font-sans">Marge &gt; 100% (S &ge; 1)</div>
                <div className="text-lg font-bold text-slate-300 tabular-nums">
                  {stats?.rejectedByReason?.NO_ARBITRAGE ?? 0}
                </div>
              </button>

              <button
                onClick={() => setAuditReasonFilter('EXPIRED_ODDS')}
                className={`p-2 rounded border text-left transition-colors ${
                  auditReasonFilter === 'EXPIRED_ODDS'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[10px] text-slate-500 font-sans">Cotes Périmées</div>
                <div className="text-lg font-bold text-rose-400 tabular-nums">
                  {stats?.rejectedByReason?.EXPIRED_ODDS ?? 0}
                </div>
              </button>

              <button
                onClick={() => setAuditReasonFilter('INCOMPATIBLE_RULES')}
                className={`p-2 rounded border text-left transition-colors ${
                  auditReasonFilter === 'INCOMPATIBLE_RULES'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[10px] text-slate-500 font-sans">Règles Incompatibles</div>
                <div className="text-lg font-bold text-rose-400 tabular-nums">
                  {stats?.rejectedByReason?.INCOMPATIBLE_RULES ?? 0}
                </div>
              </button>
            </div>

            {/* Liste des rejets avec explication explicite */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredRejections.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">
                  Aucun événement rejeté ne correspond à ce filtre.
                </div>
              ) : (
                filteredRejections.map((rej) => (
                  <div
                    key={rej.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{rej.match}</span>
                        <span className="text-[10px] font-mono text-slate-500">· {rej.competition}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {rej.marketLabel}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-300/90 flex items-center gap-1.5 pt-0.5">
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                        <span>{rej.reasonLabel}</span>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 shrink-0 text-right">
                      {rej.bookmakersObserved.length > 0 && (
                        <div>Bookmakers : {rej.bookmakersObserved.join(', ')}</div>
                      )}
                      {rej.sumOfInverses && (
                        <div>S = {rej.sumOfInverses.toFixed(4)}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* LISTE DES OPPORTUNITÉS EXPLOITABLES */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
          <p className="text-sm font-semibold text-slate-300">Scan des marchés et calcul mathématique des inverses...</p>
          <p className="text-xs text-slate-500">Validation stricte de complétude des issues et détection des écarts.</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        isReal ? (
          /* Message honnête et pédagogique si 0 opportunité en mode réel (Phase 3 & 4) */
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 md:p-10 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-300">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>

            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-base font-bold text-white font-display">
                Aucune opportunité d'arbitrage détectée sur les cotes réelles analysées
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                (Les bookmakers ajustent rapidement leurs marges). Les marchés de football pré-match sont très efficients. Les bookmakers (1xBet, Betclic, Pinnacle...) surveillent leurs équilibres de mises en continu.
              </p>
            </div>

            <div className="max-w-md mx-auto p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-left text-xs font-mono text-slate-300 space-y-1.5">
              <div className="text-[11px] text-slate-400 font-sans font-semibold">Diagnostic du scan réel :</div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Compétitions scannées :</span>
                <span className="text-slate-200">Premier League, Ligue 1, UEFA CL, CAN</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Marchés vérifiés :</span>
                <span className="text-slate-200">1X2 (3 issues), Over/Under 2.5, BTTS</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Statut de connexion API :</span>
                <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                  {isConnected ? 'Connectée (Cotes fraîches)' : 'En attente de clé APISPORTS_KEY'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onToggleDataSourceMode('demo')}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
              >
                S'exercer sur des surebets théoriques (Mode Démo)
              </button>
              <button
                onClick={handleManualRefresh}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors border border-slate-700"
              >
                Relancer le scan réel
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-400 text-xs space-y-2">
            <p className="font-semibold text-slate-300">Aucun surebet ne correspond à vos filtres actuels.</p>
            <p className="text-[11px] text-slate-500">Essayez d'abaisser le seuil minimal de rendement ou de réinitialiser les filtres.</p>
            <button
              onClick={() => {
                setSelectedSport('all');
                setSelectedCompetition('all');
                setSelectedMarket('all');
                setModeFilter('all');
                setSelectedBookmaker('all');
                setMinYield(0);
                setSearchQuery('');
              }}
              className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {filteredOpportunities.map((item) => {
            const isFav = favorites.includes(item.id);
            const isItemExpired = Boolean(
              item.isExpired || Math.floor((item.freshnessSeconds || 0) / 60) > freshnessThreshold
            );

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 md:p-5 transition-all space-y-4 ${
                  isItemExpired
                    ? 'border-amber-500/40 bg-slate-950/70 opacity-80'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                {/* LIGNE 1 : ÉTIQUETTE EXPLICITE + MÉTADONNÉES DE COLLECTE ET FRAÎCHEUR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/70 pb-3">
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    {/* Mention obligatoire du mode */}
                    {item.isDemoData ? (
                      <span className="font-mono text-[10px] font-bold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        DÉMONSTRATION — NON VÉRIFIÉE
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] font-bold tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded">
                        DONNÉES RÉELLES (API-FOOTBALL)
                      </span>
                    )}

                    {/* Badge de fraîcheur / péremption */}
                    {isItemExpired ? (
                      <span className="font-mono text-[10px] font-bold tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>PÉRIMÉE (&gt; {freshnessThreshold}m)</span>
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>FRAÎCHE ({formatFreshness(item.freshnessSeconds)})</span>
                      </span>
                    )}

                    <span className="text-slate-500">·</span>
                    <span className="font-medium text-slate-300">{item.competition}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">{item.sportName}</span>
                    <span className="text-slate-500">·</span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {item.isLive ? (
                        <span className="text-rose-400 font-semibold">
                          EN DIRECT ({item.liveMinute || 'Live'})
                        </span>
                      ) : (
                        <span>{formatMatchTime(item.startTime)}</span>
                      )}
                    </span>
                  </div>

                  {/* Rendement théorique (%) */}
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

                {/* TITRE DE LA RENCONTRE ET MARCHÉ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">
                      {item.homeTeam} <span className="text-slate-500 font-normal">vs</span> {item.awayTeam}
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>Marché : <strong className="text-slate-200">{item.marketLabel}</strong></span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 text-[11px]">
                        Règle : {item.settlementRule || 'Temps réglementaire (90 min)'}
                      </span>
                    </div>
                  </div>

                  {item.riskLevel === 'ALERTE_ERREUR_PALP' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Risque d'erreur de cote bookmaker (Palpable Error)</span>
                    </div>
                  )}
                </div>

                {/* GRILLE DES COTES AVEC BOOKMAKER, ISSUE ET HORODATAGE DE COTE */}
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
                          <span className="font-medium text-slate-300">{outcome.bookmakerName}</span>
                          {outcome.officialUrl && (
                            <a
                              href={outcome.officialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-slate-300"
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                        {outcome.timestamp && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            Cote MAJ : {new Date(outcome.timestamp).toLocaleTimeString('fr-FR')}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                          {outcome.odd.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          inv: {(1 / outcome.odd).toFixed(3)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* BAS DE CARTE : HORODATAGE DE COLLECTE & BOUTON VERS CALCULATEUR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/50 text-xs">
                  <div className="space-y-0.5 text-[11px] text-slate-400">
                    <div>
                      {item.isDemoData
                        ? 'Données de simulation déterministe. Ne constitue pas un gain garanti.'
                        : 'Source réelle : API-Football. Vérifiez la cote sur le site officiel avant tout placement.'}
                    </div>
                    {item.collectedAt && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        Collecté par le serveur le : {new Date(item.collectedAt).toLocaleTimeString('fr-FR')} · {item.validationMessage}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isItemExpired ? (
                      <button
                        onClick={() => onOpenCalculator(item)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors font-semibold"
                        title="Attention : cotes périmées, vérifiez les cotes avant de parier"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                        <span>Calculer malgré péremption</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenCalculator(item)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors font-semibold"
                      >
                        <Calculator className="h-3.5 w-3.5" />
                        <span>Calculer les mises FCFA</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
