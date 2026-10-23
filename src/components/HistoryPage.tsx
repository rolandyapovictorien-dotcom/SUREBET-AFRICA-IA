import React, { useState, useEffect } from 'react';
import {
  History,
  Clock,
  ExternalLink,
  Calculator,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { HistoryOpportunity, SurebetOpportunity } from '../types/surebet';
import { formatPercent } from '../utils/formatters';

interface HistoryPageProps {
  onLoadIntoCalculator: (surebet: SurebetOpportunity) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onLoadIntoCalculator }) => {
  const [historyItems, setHistoryItems] = useState<HistoryOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string>('all');

  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((data) => {
        if (data.history) setHistoryItems(data.history);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = historyItems.filter((item) => {
    if (selectedSport !== 'all' && item.sport.toLowerCase() !== selectedSport.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const text = `${item.match} ${item.competition} ${item.sport}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Journal d'Arbitrage</span>
            <span aria-hidden="true">·</span>
            <span>Persistance des Cotes</span>
            <span aria-hidden="true">·</span>
            <span>Données de Test</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white font-display">
            Historique des Opportunités d'Arbitrage
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Historique de démonstration permettant d'étudier la durée de vie des cotes avant réajustement.
          </p>
        </div>

        {/* Badge explicite de conformité */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono font-semibold self-start md:self-auto">
          <AlertCircle className="h-4 w-4" />
          <span>DÉMONSTRATION — DONNÉES FICTIVES</span>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher dans l'historique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-400">
          <span>Sport :</span>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="rounded border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Tous les sports</option>
            <option value="Football">Football</option>
            <option value="Basketball">Basketball</option>
            <option value="Tennis">Tennis</option>
            <option value="MMA / UFC">MMA / UFC</option>
          </select>
        </div>
      </div>

      {/* Liste de l'historique */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
          <p className="text-sm">Chargement de l'historique de démonstration...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-400 text-xs">
          Aucun événement historique ne correspond à vos critères.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:p-5 space-y-3"
            >
              {/* Entête de carte avec mention obligatoire */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    DÉMONSTRATION — NON VÉRIFIÉE
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300 font-medium">{item.competition}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">
                    {item.sportIcon} {item.sport}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Détecté à {item.detectedAt}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                    {formatPercent(item.yieldPercent)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    S = {item.sumOfInverses.toFixed(5)}
                  </div>
                </div>
              </div>

              {/* Titre et marché */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h3 className="text-base font-bold text-white font-display">{item.match}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Marché : <span className="text-slate-200">{item.market}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 font-mono">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>Fenêtre active : <strong>{item.durationMinutes} min</strong></span>
                </div>
              </div>

              {/* Grille des cotes enregistrées */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                {item.outcomes.map((out, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between font-mono"
                  >
                    <span className="text-slate-300 font-sans">{out.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">{out.bookmaker}</span>
                      <span className="font-bold text-emerald-400 tabular-nums">
                        {out.odd.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clôture & Résolution */}
              <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">
                  Résolution : <span className="text-slate-300">{item.resolutionNote}</span>
                </span>

                <button
                  onClick={() =>
                    onLoadIntoCalculator({
                      id: item.id,
                      sportId: 'football',
                      sportName: item.sport,
                      competition: item.competition,
                      homeTeam: item.match.split(' vs ')[0] || item.match,
                      awayTeam: item.match.split(' vs ')[1] || '',
                      startTime: new Date().toISOString(),
                      isLive: false,
                      marketType: '1X2',
                      marketLabel: item.market,
                      settlementRule: 'Temps réglementaire 90 min (hors prolongations)',
                      outcomes: item.outcomes.map((o, idx) => ({
                        key: String(idx + 1),
                        label: o.label,
                        odd: o.odd,
                        bookmakerId: o.bookmaker.toLowerCase().replace(/[^a-z0-9]/g, ''),
                        bookmakerName: o.bookmaker,
                        timestamp: new Date().toISOString(),
                      })),
                      sumOfInverses: item.sumOfInverses,
                      theoreticalYieldPercent: item.yieldPercent,
                      freshnessSeconds: 60,
                      detectedAt: item.detectedAt,
                      collectedAt: new Date().toISOString(),
                      providerUpdatedAt: new Date().toISOString(),
                      validationStatus: 'VALIDATED',
                      validationMessage: 'Archive historique vérifiée',
                      riskLevel: 'FAIBLE',
                      isDemoData: true,
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs font-medium self-end sm:self-auto"
                >
                  <Calculator className="h-3 w-3" />
                  <span>Recharger dans le calculateur</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
