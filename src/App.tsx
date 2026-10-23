import React, { useState, useEffect, useCallback } from 'react';
import { Header, AppPage } from './components/Header';
import { DemoDisclaimerBanner } from './components/DemoDisclaimerBanner';
import { DashboardPage } from './components/DashboardPage';
import { ScannerPage } from './components/ScannerPage';
import { CalculatorPage } from './components/CalculatorPage';
import { SportsPage } from './components/SportsPage';
import { HistoryPage } from './components/HistoryPage';
import { SettingsPage } from './components/SettingsPage';
import { OddsSourcesPage } from './components/OddsSourcesPage';
import {
  SurebetOpportunity,
  Sport,
  UserSettings,
  SportId,
  DataSourceMode,
  ApiFootballDiagnostic,
  ScannerStats,
  RejectedEventSummary,
} from './types/surebet';
import { SPORTS_REGISTRY } from './data/bookmakers';

const DEFAULT_SETTINGS: UserSettings = {
  defaultStake: 100000, // 100 000 FCFA
  minYieldThreshold: 1.5, // 1.5%
  maxFreshnessMinutes: 15,
  roundingMode: '100',
  timezone: 'Africa/Abidjan',
  audioAlertsEnabled: true,
};

// Fonction de requête résiliente avec relance automatique en cas de latence serveur
async function fetchWithRetry(url: string, retries = 2, delayMs = 600): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      if (attempt < retries && (res.status >= 500 || res.status === 404)) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Échec de connexion vers ${url}`);
}

export default function App() {
  const [activePage, setActivePage] = useState<AppPage>('dashboard');
  const [opportunities, setOpportunities] = useState<SurebetOpportunity[]>([]);
  const [sports, setSports] = useState<Sport[]>(SPORTS_REGISTRY);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('En cours...');
  const [networkNotice, setNetworkNotice] = useState<string | null>(null);

  // Mode de données : 'demo' (démonstration déterministe) ou 'real_api_football' (flux réel)
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>('demo');
  const [diagnostic, setDiagnostic] = useState<ApiFootballDiagnostic | null>(null);
  const [scannerStats, setScannerStats] = useState<ScannerStats | null>(null);
  const [rejectedEvents, setRejectedEvents] = useState<RejectedEventSummary[]>([]);

  // Paramètres utilisateur avec persistance localStorage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('surebet_africa_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [favorites, setFavorites] = useState<string[]>(['arb-uefa-01']);
  const [selectedSurebetForCalculator, setSelectedSurebetForCalculator] =
    useState<SurebetOpportunity | null>(null);

  // Diagnostic en direct de l'état d'API-Football
  const fetchDiagnostic = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/providers/api-football/diagnostic', 1, 800);
      if (res.ok) {
        const data = await res.json();
        setDiagnostic(data);
      }
    } catch (err: any) {
      console.warn('Diagnostic API en attente:', err?.message || err);
    }
  }, []);

  const fetchOpportunities = useCallback(async () => {
    setIsRefreshing(true);
    setNetworkNotice(null);
    try {
      const res = await fetchWithRetry(`/api/arbitrage/opportunities?source=${dataSourceMode}`, 2, 800);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.opportunities)) {
        setOpportunities(data.opportunities);
      } else {
        setOpportunities([]);
      }
      if (data.diagnostic) {
        setDiagnostic(data.diagnostic);
      }
      if (data.stats) {
        setScannerStats(data.stats);
      }
      if (Array.isArray(data.rejectedEvents)) {
        setRejectedEvents(data.rejectedEvents);
      }
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR', { timeZone: settings.timezone }));
    } catch (err: any) {
      console.warn('Information connexion opportunités:', err?.message || err);
      setNetworkNotice('Synchronisation réseau en cours...');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dataSourceMode, settings.timezone]);

  const fetchSports = useCallback(async () => {
    try {
      const res = await fetchWithRetry('/api/sports', 1, 800);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSports(data);
        }
      }
    } catch (err: any) {
      console.warn('Catalogue sports local utilisé:', err?.message || err);
    }
  }, []);

  useEffect(() => {
    fetchSports();
    fetchDiagnostic();
  }, [fetchSports, fetchDiagnostic]);

  useEffect(() => {
    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 25000);
    return () => clearInterval(interval);
  }, [fetchOpportunities]);

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('surebet_africa_settings', JSON.stringify(newSettings));
    } catch {}
  };

  const handleToggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((f) => f !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const handleSelectSportFromCoverage = (sportId: SportId) => {
    setActivePage('scanner');
  };

  const handleSelectSurebetForCalculator = (surebet: SurebetOpportunity) => {
    setSelectedSurebetForCalculator(surebet);
    setActivePage('calculator');
  };

  const handleToggleDataSourceMode = (mode: DataSourceMode) => {
    setDataSourceMode(mode);
    setLoading(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation principale */}
      <Header
        activeTab={activePage}
        onSelectTab={setActivePage}
        opportunitiesCount={opportunities.length}
        dataSourceMode={dataSourceMode}
        onToggleDataSourceMode={handleToggleDataSourceMode}
        isKeyConfigured={diagnostic?.isKeyConfigured}
      />

      {/* Avertissement explicite Mode Démonstration / Mode Réel */}
      <DemoDisclaimerBanner
        dataSourceMode={dataSourceMode}
        onToggleMode={handleToggleDataSourceMode}
        diagnostic={diagnostic}
        onNavigateToSources={() => setActivePage('sources')}
      />

      {networkNotice && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-300 flex items-center justify-between">
          <span>{networkNotice}</span>
          <button
            onClick={() => fetchOpportunities()}
            className="text-[11px] underline font-medium hover:text-white cursor-pointer"
          >
            Actualiser
          </button>
        </div>
      )}

      {/* Contenu principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activePage === 'dashboard' && (
          <DashboardPage
            opportunities={opportunities}
            sports={sports}
            lastSyncTime={lastSyncTime}
            defaultStake={settings.defaultStake}
            onNavigate={setActivePage}
            onSelectSurebetForCalculator={handleSelectSurebetForCalculator}
            dataSourceMode={dataSourceMode}
            onToggleDataSourceMode={handleToggleDataSourceMode}
            diagnostic={diagnostic}
          />
        )}

        {activePage === 'scanner' && (
          <ScannerPage
            opportunities={opportunities}
            sports={sports}
            loading={loading}
            isRefreshing={isRefreshing}
            onRefresh={fetchOpportunities}
            onOpenCalculator={handleSelectSurebetForCalculator}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            minYieldFilter={settings.minYieldThreshold}
            maxFreshnessMinutes={settings.maxFreshnessMinutes}
            dataSourceMode={dataSourceMode}
            onToggleDataSourceMode={handleToggleDataSourceMode}
            diagnostic={diagnostic}
            stats={scannerStats}
            rejectedEvents={rejectedEvents}
            onNavigateToSources={() => setActivePage('sources')}
          />
        )}

        {activePage === 'calculator' && (
          <CalculatorPage
            initialSurebet={selectedSurebetForCalculator}
            onClearInitialSurebet={() => setSelectedSurebetForCalculator(null)}
            defaultStake={settings.defaultStake}
            defaultRoundingMode={settings.roundingMode}
          />
        )}

        {activePage === 'sources' && (
          <OddsSourcesPage
            dataSourceMode={dataSourceMode}
            onToggleDataSourceMode={handleToggleDataSourceMode}
          />
        )}

        {activePage === 'sports' && (
          <SportsPage
            sports={sports}
            onSelectSport={handleSelectSportFromCoverage}
          />
        )}

        {activePage === 'history' && (
          <HistoryPage onLoadIntoCalculator={handleSelectSurebetForCalculator} />
        )}

        {activePage === 'settings' && (
          <SettingsPage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Pied de page sobre */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Surebet Africa AI</span>
            <span>·</span>
            <span>Phase 3 : Intégration Cotes Réelles (API-Football) & Moteur d'Arbitrage</span>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-500">
            Avertissement légal : Données informatives. Aucune prise de pari n'est automatisée. Montants exprimés en FCFA.
          </div>
        </div>
      </footer>
    </div>
  );
}
