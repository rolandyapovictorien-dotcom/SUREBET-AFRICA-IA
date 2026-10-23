import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Database,
  ExternalLink,
  Layers,
  Clock,
  Key,
  ShieldAlert,
  HelpCircle,
  Globe,
  Radio,
  Trophy,
  Zap,
} from 'lucide-react';
import { ApiFootballDiagnostic, TheOddsApiDiagnostic, DataSourceMode } from '../types/surebet';

interface OddsSourcesPageProps {
  dataSourceMode?: DataSourceMode;
  onToggleDataSourceMode?: (mode: DataSourceMode) => void;
}

export const OddsSourcesPage: React.FC<OddsSourcesPageProps> = ({
  dataSourceMode = 'demo',
  onToggleDataSourceMode,
}) => {
  const [activeProviderView, setActiveProviderView] = useState<'the_odds_api' | 'api_football'>('the_odds_api');

  // État API-Football
  const [apiFootballDiag, setApiFootballDiag] = useState<ApiFootballDiagnostic | null>(null);
  const [loadingApiFootball, setLoadingApiFootball] = useState<boolean>(true);
  const [testingApiFootball, setTestingApiFootball] = useState<boolean>(false);

  // État The Odds API V4
  const [theOddsApiDiag, setTheOddsApiDiag] = useState<TheOddsApiDiagnostic | null>(null);
  const [theOddsApiSports, setTheOddsApiSports] = useState<any[]>([]);
  const [loadingTheOddsApi, setLoadingTheOddsApi] = useState<boolean>(true);
  const [testingTheOddsApi, setTestingTheOddsApi] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  const fetchApiFootball = async () => {
    try {
      const res = await fetch('/api/providers/api-football/diagnostic');
      if (res.ok) {
        const data = await res.json();
        setApiFootballDiag(data);
      }
    } catch (err: any) {
      console.warn('Diagnostic API-Football en attente:', err?.message || err);
    } finally {
      setLoadingApiFootball(false);
    }
  };

  const fetchTheOddsApi = async () => {
    try {
      const res = await fetch('/api/providers/the-odds-api/diagnostic');
      if (res.ok) {
        const data = await res.json();
        setTheOddsApiDiag(data);

        if (data.connectionState === 'connected') {
          const sportsRes = await fetch('/api/providers/the-odds-api/sports');
          if (sportsRes.ok) {
            const sportsData = await sportsRes.json();
            if (sportsData.success && Array.isArray(sportsData.sports)) {
              setTheOddsApiSports(sportsData.sports);
            }
          }
        }
      }
      setLastCheckTime(new Date().toLocaleTimeString('fr-FR'));
    } catch (err: any) {
      console.warn('Diagnostic The Odds API en attente:', err?.message || err);
    } finally {
      setLoadingTheOddsApi(false);
    }
  };

  const handleTestApiFootball = async () => {
    setTestingApiFootball(true);
    try {
      const res = await fetch('/api/providers/api-football/test-connection', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setApiFootballDiag(data);
      }
    } catch (err: any) {
      console.warn('Test de connexion API-Football échoué:', err?.message || err);
    } finally {
      setTestingApiFootball(false);
    }
  };

  const handleTestTheOddsApi = async () => {
    setTestingTheOddsApi(true);
    try {
      const res = await fetch('/api/providers/the-odds-api/test-connection', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTheOddsApiDiag(data);

        if (data.connectionState === 'connected') {
          const sportsRes = await fetch('/api/providers/the-odds-api/sports');
          if (sportsRes.ok) {
            const sportsData = await sportsRes.json();
            if (sportsData.success && Array.isArray(sportsData.sports)) {
              setTheOddsApiSports(sportsData.sports);
            }
          }
        }
      }
      setLastCheckTime(new Date().toLocaleTimeString('fr-FR'));
    } catch (err: any) {
      console.warn('Test connexion The Odds API échoué:', err?.message || err);
    } finally {
      setTestingTheOddsApi(false);
    }
  };

  useEffect(() => {
    fetchApiFootball();
    fetchTheOddsApi();
  }, []);

  const stateColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
    connected: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      label: 'API Connectée (Flux Réel Validé)',
    },
    not_configured: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      label: 'Clé Non Configurée (Mode Démonstration Actif)',
    },
    invalid_key: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      label: 'Clé Invalide ou Non Autorisée (HTTP 401/403)',
    },
    rate_limited: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      label: 'Quota Dépassé / Rate Limit (HTTP 429)',
    },
    network_error: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      label: 'Erreur Réseau ou Timeout',
    },
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Diagnostic Fournisseurs</span>
            <span aria-hidden="true">·</span>
            <span>Intégration API Temps Réel</span>
            <span aria-hidden="true">·</span>
            <span>Surveillance Quotas & Latence</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white font-display">
            Sources de Cotes & Connecteurs API
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Surveillance des flux officiels, validation des clés serveur sans fuite, et suivi des quotas.
          </p>
        </div>

        {/* Sélecteur global de source */}
        {onToggleDataSourceMode && (
          <div className="flex items-center p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => onToggleDataSourceMode('demo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                dataSourceMode === 'demo'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dataSourceMode === 'demo' ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
              <span>DÉMO</span>
            </button>
            <button
              onClick={() => onToggleDataSourceMode('the_odds_api')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                dataSourceMode === 'the_odds_api'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  dataSourceMode === 'the_odds_api' ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                }`}
              ></span>
              <span>THE ODDS API</span>
            </button>
            <button
              onClick={() => onToggleDataSourceMode('real_api_football')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                dataSourceMode === 'real_api_football'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  dataSourceMode === 'real_api_football' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              ></span>
              <span>API-FOOTBALL</span>
            </button>
          </div>
        )}
      </div>

      {/* Onglets de sélection du fournisseur à diagnostiquer */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveProviderView('the_odds_api')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeProviderView === 'the_odds_api'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>The Odds API V4 (Agrégateur Multi-Sports)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
            {theOddsApiDiag?.connectionState === 'connected' ? 'Connecté' : 'Attente'}
          </span>
        </button>

        <button
          onClick={() => setActiveProviderView('api_football')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeProviderView === 'api_football'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>API-Football (Football Pré-Match)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
            {apiFootballDiag?.connectionState === 'connected' ? 'Connecté' : 'Attente Clé'}
          </span>
        </button>
      </div>

      {/* VUE 1 : THE ODDS API V4 */}
      {activeProviderView === 'the_odds_api' && (
        <div className="space-y-6">
          {(() => {
            const state = theOddsApiDiag?.connectionState || 'not_configured';
            const meta = stateColors[state] || stateColors.not_configured;

            return (
              <>
                {/* Bandeau d'état */}
                <div className={`rounded-xl border p-5 ${meta.border} ${meta.bg} space-y-3`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Zap className={`h-5 w-5 ${meta.text}`} />
                      <div>
                        <h2 className={`text-base font-bold font-display ${meta.text}`}>
                          {meta.label}
                        </h2>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Fournisseur : <strong>The Odds API V4</strong> · Endpoint officiel : <code className="font-mono text-cyan-300">api.the-odds-api.com/v4</code>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleTestTheOddsApi}
                      disabled={testingTheOddsApi || loadingTheOddsApi}
                      className="flex items-center gap-2 rounded-lg border border-cyan-700/50 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-cyan-200 hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${testingTheOddsApi ? 'animate-spin text-cyan-400' : ''}`} />
                      <span>Tester The Odds API</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {theOddsApiDiag?.message}
                  </p>

                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>État de la clé serveur : <strong className="text-slate-200 font-mono">{theOddsApiDiag?.maskedKeyNotice}</strong></span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Variable : THE_ODDS_API_KEY</span>
                  </div>
                </div>

                {/* Métriques et Quotas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
                    <div className="text-xs text-slate-400">Quota Restant (Header API)</div>
                    <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
                      {theOddsApiDiag?.requestsRemaining ?? '-'} <span className="text-sm font-normal text-slate-500">req</span>
                    </div>
                    <div className="text-[11px] text-slate-400">En-tête x-requests-remaining</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
                    <div className="text-xs text-slate-400">Requêtes Consommées</div>
                    <div className="text-2xl font-bold font-mono text-white tabular-nums">
                      {theOddsApiDiag?.requestsUsed ?? 0} <span className="text-sm font-normal text-slate-500">req</span>
                    </div>
                    <div className="text-[11px] text-slate-400">En-tête x-requests-used</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
                    <div className="text-xs text-slate-400">Latence Serveur</div>
                    <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                      {theOddsApiDiag?.latencyMs ? `${theOddsApiDiag.latencyMs} ms` : '-'}
                    </div>
                    <div className="text-[11px] text-slate-400">Temps aller-retour réseau</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
                    <div className="text-xs text-slate-400">Catalogue des Sports</div>
                    <div className="text-2xl font-bold font-mono text-white tabular-nums">
                      {theOddsApiDiag?.activeSportsCount ?? theOddsApiSports.length} <span className="text-sm font-normal text-slate-500">actifs</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Sur {theOddsApiDiag?.totalSportsCount ?? 83} sports au total</div>
                  </div>
                </div>

                {/* Liste du catalogue des sports récupéré */}
                {theOddsApiSports.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-cyan-400" />
                        <span>Catalogue Officiel des Sports Disponibles (The Odds API V4)</span>
                      </h3>
                      <span className="text-xs font-mono text-slate-400">
                        {theOddsApiSports.length} compétitions actives reçues
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {theOddsApiSports.slice(0, 30).map((sport) => (
                        <div
                          key={sport.key}
                          className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white truncate">{sport.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300">
                              {sport.group}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">{sport.key}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* VUE 2 : API-FOOTBALL */}
      {activeProviderView === 'api_football' && (
        <div className="space-y-6">
          {(() => {
            const state = apiFootballDiag?.connectionState || 'not_configured';
            const meta = stateColors[state] || stateColors.not_configured;

            return (
              <>
                {/* BANDEAU D'ÉTAT PRINCIPAL DE CONNEXION */}
                <div className={`rounded-xl border p-5 ${meta.border} ${meta.bg} space-y-3`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Server className={`h-5 w-5 ${meta.text}`} />
                      <div>
                        <h2 className={`text-base font-bold font-display ${meta.text}`}>
                          {meta.label}
                        </h2>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Fournisseur : <strong>API-Football (v3.football.api-sports.io)</strong> · Protocole HTTPS direct
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleTestApiFootball}
                      disabled={testingApiFootball || loadingApiFootball}
                      className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${testingApiFootball ? 'animate-spin text-emerald-400' : ''}`} />
                      <span>Tester API-Football</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {apiFootballDiag?.message}
                  </p>

                  {!apiFootballDiag?.isKeyConfigured && (
                    <div className="mt-3 p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                      <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5" />
                        <span>Configuration du secret APISPORTS_KEY</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Ajoutez la variable d'environnement secrète nommée <code className="text-amber-300 font-mono">APISPORTS_KEY</code> dans les secrets AI Studio pour activer ce fournisseur.
                      </p>
                    </div>
                  )}
                </div>

                {/* GRILLE DES COMPTEURS & QUOTAS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
                    <div className="text-xs text-slate-400">Requêtes Utilisées / Jour</div>
                    <div className="text-2xl font-bold font-mono text-white tabular-nums">
                      {apiFootballDiag?.requestsUsedToday} <span className="text-sm font-normal text-slate-500">/ {apiFootballDiag?.dailyLimit}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {apiFootballDiag?.dailyLimit ? `${apiFootballDiag.dailyLimit - apiFootballDiag.requestsUsedToday} restantes` : '-'}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
                    <div className="text-xs text-slate-400">Forfait Fournisseur</div>
                    <div className="text-xl font-bold font-mono text-emerald-400 truncate">
                      {apiFootballDiag?.planName || 'Free Plan (100/j)'}
                    </div>
                    <div className="text-[11px] text-slate-400">{apiFootballDiag?.accountEmail || 'Compte non lié'}</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
                    <div className="text-xs text-slate-400">Latence Serveur API</div>
                    <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
                      {apiFootballDiag?.latencyMs ? `${apiFootballDiag.latencyMs} ms` : '-'}
                    </div>
                    <div className="text-[11px] text-slate-400">Mesurée via endpoint /status</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
                    <div className="text-xs text-slate-400">Durée du Cache Serveur</div>
                    <div className="text-2xl font-bold font-mono text-white tabular-nums">
                      {apiFootballDiag?.cacheTtlSeconds} s
                    </div>
                    <div className="text-[11px] text-slate-400">Évite l'épuisement du quota</div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
