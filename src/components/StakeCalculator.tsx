import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Trash2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { ArbitrageEngine, RawOutcomeInput } from '../engine/arbitrageEngine';
import { CalculationResult, RoundingMode, SurebetOpportunity } from '../types/surebet';
import { formatFcfa, formatPercent } from '../utils/formatters';

interface StakeCalculatorProps {
  initialSurebet?: SurebetOpportunity | null;
  onClearInitialSurebet?: () => void;
}

export const StakeCalculator: React.FC<StakeCalculatorProps> = ({
  initialSurebet,
  onClearInitialSurebet,
}) => {
  // Mode 2 issues ou 3 issues
  const [outcomes, setOutcomes] = useState<RawOutcomeInput[]>([
    {
      key: '1',
      label: 'Issue 1 (ex: Paris SG)',
      odd: 2.85,
      bookmakerId: '1xbet',
      bookmakerName: '1xBet CI',
      officialUrl: 'https://1xbet.ci',
    },
    {
      key: 'X',
      label: 'Issue 2 (ex: Match Nul)',
      odd: 3.80,
      bookmakerId: 'premierbet',
      bookmakerName: 'Premier Bet CI',
      officialUrl: 'https://www.premierbet.ci',
    },
    {
      key: '2',
      label: 'Issue 3 (ex: Man City)',
      odd: 2.90,
      bookmakerId: 'betclic',
      bookmakerName: 'Betclic',
      officialUrl: 'https://www.betclic.com',
    },
  ]);

  const [totalBudget, setTotalBudget] = useState<number>(100000); // 100 000 FCFA
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('100');
  const [presetTitle, setPresetTitle] = useState<string>('UEFA Champions League · Quarts (Exemple 3-issues)');

  // Simulation de variation de cote imprévue
  const [simulateOddsDrop, setSimulateOddsDrop] = useState<boolean>(false);
  const [dropOutcomeIndex, setDropOutcomeIndex] = useState<number>(0);
  const [droppedOddValue, setDroppedOddValue] = useState<number>(2.40);

  // Charger un surebet sélectionné depuis le scanner
  useEffect(() => {
    if (initialSurebet) {
      setPresetTitle(`${initialSurebet.competition} · ${initialSurebet.homeTeam} vs ${initialSurebet.awayTeam}`);
      const mapped: RawOutcomeInput[] = initialSurebet.outcomes.map((o) => ({
        key: o.key,
        label: o.label,
        odd: o.odd,
        bookmakerId: o.bookmakerId,
        bookmakerName: o.bookmakerName,
        officialUrl: o.officialUrl,
      }));
      setOutcomes(mapped);
    }
  }, [initialSurebet]);

  // Calcul mathématique avec ArbitrageEngine
  const calculation: CalculationResult = useMemo(() => {
    const activeOutcomes = outcomes.map((item, idx) => {
      if (simulateOddsDrop && idx === dropOutcomeIndex) {
        return { ...item, odd: droppedOddValue };
      }
      return item;
    });
    return ArbitrageEngine.calculateStakes(activeOutcomes, totalBudget, roundingMode);
  }, [outcomes, totalBudget, roundingMode, simulateOddsDrop, dropOutcomeIndex, droppedOddValue]);

  const handleOddChange = (index: number, newOdd: number) => {
    const updated = [...outcomes];
    updated[index] = { ...updated[index], odd: Math.max(1.01, Number(newOdd) || 1.01) };
    setOutcomes(updated);
  };

  const handleLabelChange = (index: number, newLabel: string) => {
    const updated = [...outcomes];
    updated[index] = { ...updated[index], label: newLabel };
    setOutcomes(updated);
  };

  const handleBookmakerChange = (index: number, newBookmakerName: string) => {
    const updated = [...outcomes];
    updated[index] = { ...updated[index], bookmakerName: newBookmakerName };
    setOutcomes(updated);
  };

  const addOutcome = () => {
    if (outcomes.length >= 4) return;
    const nextNum = outcomes.length + 1;
    setOutcomes([
      ...outcomes,
      {
        key: `O${nextNum}`,
        label: `Issue ${nextNum}`,
        odd: 3.0,
        bookmakerId: 'sportcash',
        bookmakerName: 'Sportcash CI',
      },
    ]);
  };

  const removeOutcome = (index: number) => {
    if (outcomes.length <= 2) return;
    setOutcomes(outcomes.filter((_, i) => i !== index));
  };

  const applyPreset = (type: '3way' | '2way_tennis' | '2way_goals') => {
    if (type === '3way') {
      setPresetTitle('Football 1X2 · 3 Issues');
      setOutcomes([
        { key: '1', label: 'Équipe 1', odd: 2.85, bookmakerId: '1xbet', bookmakerName: '1xBet CI' },
        { key: 'X', label: 'Match Nul', odd: 3.80, bookmakerId: 'premierbet', bookmakerName: 'Premier Bet' },
        { key: '2', label: 'Équipe 2', odd: 2.90, bookmakerId: 'betclic', bookmakerName: 'Betclic' },
      ]);
    } else if (type === '2way_tennis') {
      setPresetTitle('Tennis / Basketball · Face-à-Face 2 Issues');
      setOutcomes([
        { key: '1', label: 'Joueur 1 (Alcaraz)', odd: 1.68, bookmakerId: 'premierbet', bookmakerName: 'Premier Bet CI' },
        { key: '2', label: 'Joueur 2 (Sinner)', odd: 2.75, bookmakerId: 'melbet', bookmakerName: 'Melbet' },
      ]);
    } else {
      setPresetTitle('Plus/Moins de 2.5 Buts · 2 Issues');
      setOutcomes([
        { key: 'Over', label: 'Plus de 2.5 Buts', odd: 2.30, bookmakerId: 'sportcash', bookmakerName: 'Sportcash CI' },
        { key: 'Under', label: 'Moins de 2.5 Buts', odd: 1.88, bookmakerId: '1xbet', bookmakerName: '1xBet CI' },
      ]);
    }
  };

  const quickBudgets = [25000, 50000, 100000, 250000, 500000, 1000000];

  return (
    <div className="space-y-6">
      {/* Kicker et Titre */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Moteur Mathématique Déterministe</span>
            <span aria-hidden="true">·</span>
            <span>Devise FCFA (XOF / XAF)</span>
            <span aria-hidden="true">·</span>
            <span>Optimisation des Mises</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white font-display">
            Calculateur de Mises & Rendement FCFA
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            {presetTitle}
          </p>
        </div>

        {/* Boutons de présélection */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => applyPreset('3way')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              outcomes.length === 3 ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Football 1X2 (3 issues)
          </button>
          <button
            onClick={() => applyPreset('2way_tennis')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              outcomes.length === 2 && outcomes[0].key === '1'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Face-à-Face (2 issues)
          </button>
          <button
            onClick={() => applyPreset('2way_goals')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              outcomes.length === 2 && outcomes[0].key === 'Over'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Plus/Moins (2 issues)
          </button>
        </div>
      </div>

      {/* Configuration du capital & Arrondis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center justify-between">
              <span>Capital Global à Engager</span>
              <span className="text-xs font-mono text-emerald-400">{formatFcfa(totalBudget)}</span>
            </h2>

            {/* Input montant */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Montant Total (en FCFA)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-slate-500">FCFA</span>
              </div>
            </div>

            {/* Chips de montants rapides */}
            <div className="flex flex-wrap gap-1.5">
              {quickBudgets.map((b) => (
                <button
                  key={b}
                  onClick={() => setTotalBudget(b)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors ${
                    totalBudget === b
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {formatFcfa(b)}
                </button>
              ))}
            </div>

            {/* Pas d'arrondi en FCFA */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs text-slate-400 block mb-1.5">
                Règle d'Arrondi des Mises (Spécificité Marché Africain)
              </label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {(
                  [
                    { id: 'none', label: 'Au franc près', desc: 'Exact' },
                    { id: '100', label: 'Arrondi 100', desc: 'Standard' },
                    { id: '500', label: 'Arrondi 500', desc: 'Discret' },
                    { id: '1000', label: 'Arrondi 1 000', desc: 'Sécurisé' },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRoundingMode(r.id)}
                    className={`p-2 text-center rounded border transition-colors ${
                      roundingMode === r.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold">{r.label}</div>
                    <div className="text-[10px] text-slate-500">{r.desc}</div>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400 leading-normal">
                Les mises non arrondies (ex: 23 487 FCFA) attirent l'attention des algorithmes anti-arbitrage des bookmakers. Un arrondi à 100 ou 500 FCFA évite les limitations de compte.
              </p>
            </div>
          </div>

          {/* Formules et métriques mathématiques */}
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Validation Mathématique
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Somme Inverses (S)</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5 tabular-nums">
                  {calculation.sumOfInverses}
                </div>
                <div className="text-[10px] mt-1 text-slate-400">
                  {calculation.isArbitrage ? 'S < 1.0000 (Opportunité Détectée)' : 'S ≥ 1.0000 (Pas d\'arbitrage)'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Rendement Théorique</div>
                <div
                  className={`text-lg font-bold font-mono mt-0.5 tabular-nums ${
                    calculation.theoreticalYieldPercent > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatPercent(calculation.theoreticalYieldPercent)}
                </div>
                <div className="text-[10px] mt-1 text-slate-400">Formule : (1/S - 1) × 100</div>
              </div>
            </div>

            {/* Avertissement Palpable Error si détecté */}
            {calculation.palpRiskDetected && (
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300">Alerte Erreur Manifeste (Palpable Error)</span>
                  <p className="mt-0.5 text-amber-200/80 text-[11px]">
                    L'écart de cote ou le rendement anormal (&gt; 20%) indique une faute de saisie du bookmaker. Risque maximal d'annulation unilatérale du pari !
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Détail des Issues & Répartition des Mises */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Paramétrage des Issues & Cotes Comparées
              </h2>
              {outcomes.length < 4 && (
                <button
                  onClick={addOutcome}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Ajouter une issue</span>
                </button>
              )}
            </div>

            {/* Formulaire des issues */}
            <div className="space-y-3">
              {outcomes.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">
                      Issue {index + 1} ({item.key})
                    </span>
                    {outcomes.length > 2 && (
                      <button
                        onClick={() => removeOutcome(index)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Libellé</label>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleLabelChange(index, e.target.value)}
                        className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Bookmaker</label>
                      <input
                        type="text"
                        value={item.bookmakerName}
                        onChange={(e) => handleBookmakerChange(index, e.target.value)}
                        className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Meilleure Cote</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1.01"
                        value={item.odd}
                        onChange={(e) => handleOddChange(index, parseFloat(e.target.value))}
                        className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tableau récapitulatif des mises et rendements */}
            <div className="pt-3 border-t border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Tableau de Répartition des Mises FCFA
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-[11px] text-slate-400">
                    <tr>
                      <th className="pb-2 font-medium">Issue</th>
                      <th className="pb-2 font-medium">Bookmaker</th>
                      <th className="pb-2 font-medium text-right">Cote</th>
                      <th className="pb-2 font-medium text-right">Mise Arrondie</th>
                      <th className="pb-2 font-medium text-right">Gain Brut</th>
                      <th className="pb-2 font-medium text-right">Bénéfice Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {calculation.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-sans font-medium text-white">{it.label}</td>
                        <td className="py-2.5 font-sans text-slate-400">{it.bookmakerName}</td>
                        <td className="py-2.5 text-right font-bold text-white tabular-nums">
                          {it.odd.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-emerald-400 tabular-nums">
                          {formatFcfa(it.roundedStake)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-slate-300">
                          {formatFcfa(it.grossPayout)}
                        </td>
                        <td
                          className={`py-2.5 text-right font-bold tabular-nums ${
                            it.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {it.netProfit >= 0 ? '+' : ''}
                          {formatFcfa(it.netProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bilan financier */}
              <div className="mt-4 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px] text-slate-400">Mise Totale Engagée</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5 tabular-nums">
                    {formatFcfa(calculation.actualTotalStake)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {roundingMode !== 'none' ? `Arrondi ${roundingMode} FCFA` : 'Non arrondi'}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400">Bénéfice Garanti (Pire Cas)</div>
                  <div
                    className={`text-base font-bold font-mono mt-0.5 tabular-nums ${
                      calculation.worstCaseNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {calculation.worstCaseNetProfit >= 0 ? '+' : ''}
                    {formatFcfa(calculation.worstCaseNetProfit)}
                  </div>
                  <div className="text-[10px] text-slate-400">Indifférent au résultat</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400">R.O.I. Réel Effectif</div>
                  <div
                    className={`text-base font-bold font-mono mt-0.5 tabular-nums ${
                      calculation.worstCaseRoiPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatPercent(calculation.worstCaseRoiPercent)}
                  </div>
                  <div className="text-[10px] text-slate-400">Après déduction des mises</div>
                </div>
              </div>
            </div>
          </div>

          {/* Simulateur de variation de cote (Stress-Test de Sécurité) */}
          <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h4 className="text-xs font-semibold text-white">
                  Simulateur de Stress-Test : Que se passe-t-il si une cote baisse pendant la validation ?
                </h4>
              </div>
              <button
                onClick={() => setSimulateOddsDrop(!simulateOddsDrop)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  simulateOddsDrop
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {simulateOddsDrop ? 'Désactiver le test' : 'Activer le test'}
              </button>
            </div>

            {simulateOddsDrop && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-xs">
                <p className="text-slate-400 text-[11px]">
                  Simulez une chute de cote chez le bookmaker {outcomes[dropOutcomeIndex]?.bookmakerName} :
                </p>
                <div className="flex items-center gap-3">
                  <select
                    value={dropOutcomeIndex}
                    onChange={(e) => setDropOutcomeIndex(Number(e.target.value))}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                  >
                    {outcomes.map((o, idx) => (
                      <option key={idx} value={idx}>
                        {o.label} (Initiale: {o.odd})
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400">Chute à :</span>
                  <input
                    type="number"
                    step="0.05"
                    value={droppedOddValue}
                    onChange={(e) => setDroppedOddValue(Number(e.target.value))}
                    className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <p className="text-[11px] text-amber-300">
                  Résultat du stress test : {calculation.worstCaseNetProfit >= 0 ? (
                    <span className="text-emerald-400">Le surebet reste positif ({formatFcfa(calculation.worstCaseNetProfit)})</span>
                  ) : (
                    <span className="text-rose-400 font-bold">Le surebet devient déficitaire ({formatFcfa(calculation.worstCaseNetProfit)}) ! Ne validez pas sans recalcul.</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
