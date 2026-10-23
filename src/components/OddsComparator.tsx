import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, AlertCircle, Info, RefreshCw, Trophy } from 'lucide-react';
import { OddsSnapshot, SportId } from '../types/surebet';
import { BOOKMAKERS_REGISTRY, SPORTS_REGISTRY } from '../data/bookmakers';
import { formatMatchTime } from '../utils/formatters';

export const OddsComparator: React.FC = () => {
  const [matches, setMatches] = useState<OddsSnapshot[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const url =
        selectedSport !== 'all' ? `/api/matches?sport=${selectedSport}` : '/api/matches';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMatches(data);
        if (data.length > 0 && !selectedMatchId) {
          setSelectedMatchId(data[0].eventId);
        }
      }
    } catch (err) {
      console.error('Erreur chargement comparateur:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedSport]);

  const currentMatch = matches.find((m) => m.eventId === selectedMatchId) || matches[0];

  return (
    <div className="space-y-6">
      {/* Kicker et Titre */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Agrégation Multi-Bookmakers</span>
            <span aria-hidden="true">·</span>
            <span>Afrique de l'Ouest & International</span>
            <span aria-hidden="true">·</span>
            <span>Détection Meilleure Cote</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white font-display">
            Comparateur de Cotes & Marges Bookmakers
          </h1>
        </div>

        {/* Sélecteur de sport */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Sport :</span>
          <select
            value={selectedSport}
            onChange={(e) => {
              setSelectedSport(e.target.value);
              setSelectedMatchId('');
            }}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Tous les sports</option>
            {SPORTS_REGISTRY.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
          <p className="text-sm">Comparaison des grilles de cotes...</p>
        </div>
      ) : !currentMatch ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-400 text-sm">
          Aucun match disponible pour cette catégorie.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sélecteur de match actif */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <label className="text-xs text-slate-400 block mb-2 font-medium">
              Sélectionnez une rencontre à analyser :
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {matches.map((m) => (
                <button
                  key={m.eventId}
                  onClick={() => setSelectedMatchId(m.eventId)}
                  className={`p-3 text-left rounded-lg border transition-all ${
                    currentMatch.eventId === m.eventId
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[11px] text-slate-500">{m.competition}</div>
                  <div className="text-xs font-semibold text-white mt-0.5 truncate">
                    {m.homeTeam} vs {m.awayTeam}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {m.isLive ? `Live · ${m.liveMinute || ''}` : formatMatchTime(m.startTime)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Grille comparative par marché */}
          {currentMatch.markets.map((market, marketIdx) => {
            // Trouver les cotes maximales pour chaque issue
            const allOutcomesKeys = Object.keys(market.bookmakerOdds[0]?.odds || {});
            const maxOdds: Record<string, number> = {};
            allOutcomesKeys.forEach((key) => {
              maxOdds[key] = Math.max(
                ...market.bookmakerOdds.map((b) => b.odds[key] || 0)
              );
            });

            return (
              <div
                key={marketIdx}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">
                      Marché : {market.marketLabel}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Les meilleures cotes du marché sont surlignées en vert émeraude.
                    </p>
                  </div>

                  <div className="text-xs text-slate-400">
                    {currentMatch.homeTeam} vs {currentMatch.awayTeam}
                  </div>
                </div>

                {/* Table comparative */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 text-[11px] text-slate-400">
                      <tr>
                        <th className="pb-2 font-medium">Bookmaker</th>
                        <th className="pb-2 font-medium">Statut Côte d'Ivoire</th>
                        {allOutcomesKeys.map((k) => (
                          <th key={k} className="pb-2 font-medium text-right">
                            {k === '1'
                              ? `1 (${currentMatch.homeTeam})`
                              : k === '2'
                              ? `2 (${currentMatch.awayTeam})`
                              : k === 'X'
                              ? 'Nul (X)'
                              : k}
                          </th>
                        ))}
                        <th className="pb-2 font-medium text-right">Marge Bookmaker</th>
                        <th className="pb-2 font-medium text-right">Lien</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {market.bookmakerOdds.map((b, bIdx) => {
                        const bookmakerMeta = BOOKMAKERS_REGISTRY.find(
                          (reg) => reg.id === b.bookmakerId
                        );

                        // Calcul de la marge du bookmaker : (somme(1/cote) - 1) * 100
                        const sumInverses = Object.values(b.odds).reduce(
                          (sum, val) => sum + (val > 0 ? 1 / val : 0),
                          0
                        );
                        const marginPercent = (sumInverses - 1) * 100;

                        return (
                          <tr key={bIdx} className="hover:bg-slate-800/30">
                            <td className="py-3 font-sans font-medium text-white">
                              {b.bookmakerName}
                            </td>
                            <td className="py-3 font-sans text-slate-400 text-[11px]">
                              {bookmakerMeta?.isVerifiedInCI ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Vérifié en CI (LONACI / Direct)</span>
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  International (selon juridiction)
                                </span>
                              )}
                            </td>
                            {allOutcomesKeys.map((k) => {
                              const oddValue = b.odds[k];
                              const isMax = oddValue === maxOdds[k];

                              return (
                                <td
                                  key={k}
                                  className={`py-3 text-right font-bold tabular-nums ${
                                    isMax ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-300'
                                  }`}
                                >
                                  {oddValue ? oddValue.toFixed(2) : '-'}
                                </td>
                              );
                            })}
                            <td className="py-3 text-right tabular-nums text-slate-400 text-[11px]">
                              {marginPercent > 0 ? `+${marginPercent.toFixed(1)}%` : '0%'}
                            </td>
                            <td className="py-3 text-right">
                              {bookmakerMeta?.officialDomain ? (
                                <a
                                  href={bookmakerMeta.officialDomain}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center text-slate-400 hover:text-white"
                                  title="Consulter le site officiel"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Guide de conformité et paiements en Côte d'Ivoire & Afrique de l'Ouest */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Statuts Réglementaires & Moyens de Dépôt Vérifiés
            </h3>
            <p className="text-xs text-slate-400">
              Conformément à nos règles de fiabilité, voici la liste des bookmakers et leur statut vérifié pour les résidents d'Afrique de l'Ouest :
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {BOOKMAKERS_REGISTRY.map((b) => (
                <div key={b.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{b.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Fiabilité : {b.reliabilityScore}/5
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{b.countryNotice}</p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400/90 pt-1">
                    <span>Moyens de paiement :</span>
                    <span className="text-slate-300">{b.depositMethods.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
