import React, { useState } from 'react';
import {
  Compass,
  Calculator,
  LayoutDashboard,
  Trophy,
  History,
  Settings,
  Server,
  Menu,
  X,
  Shield,
} from 'lucide-react';

export type AppPage =
  | 'dashboard'
  | 'scanner'
  | 'calculator'
  | 'sources'
  | 'sports'
  | 'history'
  | 'settings';

import { DataSourceMode } from '../types/surebet';

interface HeaderProps {
  activeTab: AppPage;
  onSelectTab: (tab: AppPage) => void;
  opportunitiesCount: number;
  dataSourceMode: DataSourceMode;
  onToggleDataSourceMode: (mode: DataSourceMode) => void;
  isKeyConfigured?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  opportunitiesCount,
  dataSourceMode,
  onToggleDataSourceMode,
  isKeyConfigured = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: AppPage; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'scanner', label: 'Scanner', icon: <Compass className="h-4 w-4" />, badge: opportunitiesCount },
    { id: 'calculator', label: 'Calculateur', icon: <Calculator className="h-4 w-4" /> },
    { id: 'sources', label: 'Sources de cotes', icon: <Server className="h-4 w-4" /> },
    { id: 'sports', label: 'Sports', icon: <Trophy className="h-4 w-4" /> },
    { id: 'history', label: 'Historique', icon: <History className="h-4 w-4" /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings className="h-4 w-4" /> },
  ];

  const handleNavClick = (id: AppPage) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur-md md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1 : Nom de marque textuel propre */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('dashboard');
          }}
          className="flex items-center gap-2.5 whitespace-nowrap text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-90 shrink-0 font-display"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-sm border border-emerald-500/30">
            S
          </span>
          <span className="text-slate-100">Surebet Africa AI</span>
        </a>

        {/* Zone 2 : Liens de navigation Desktop */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-medium text-slate-400">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3 : Sélecteur de Source (Démo / API-Football / The Odds API) & Menu mobile */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => onToggleDataSourceMode('demo')}
              title="Passer en Mode Démonstration Déterministe"
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                dataSourceMode === 'demo'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dataSourceMode === 'demo' ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
              <span>DÉMO</span>
            </button>
            <button
              onClick={() => onToggleDataSourceMode('real_api_football')}
              title="Passer en Flux Réel API-Football"
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                dataSourceMode === 'real_api_football'
                  ? isKeyConfigured
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  dataSourceMode === 'real_api_football'
                    ? isKeyConfigured
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-amber-400'
                    : 'bg-slate-600'
                }`}
              ></span>
              <span>API-FOOTBALL</span>
            </button>
            <button
              onClick={() => onToggleDataSourceMode('the_odds_api')}
              title="Passer en Flux Réel The Odds API V4 (Multi-Sports)"
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                dataSourceMode === 'the_odds_api'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  dataSourceMode === 'the_odds_api'
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-slate-600'
                }`}
              ></span>
              <span>THE ODDS API</span>
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg border border-slate-800 bg-slate-900"
            aria-label="Menu de navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu Mobile déroulant */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 mt-3 pt-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
