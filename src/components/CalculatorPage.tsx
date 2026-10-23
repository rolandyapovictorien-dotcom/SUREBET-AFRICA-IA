import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  ShieldAlert,
  Coins,
  TrendingUp,
  Scale,
} from 'lucide-react';
import { ArbitrageEngine, RawOutcomeInput } from '../engine/arbitrageEngine';
import { CalculationResult, RoundingMode, SurebetOpportunity } from '../types/surebet';
import { formatFcfa, formatPercent } from '../utils/formatters';

interface CalculatorPageProps {
  initialSurebet?: SurebetOpportunity | null;
  onClearInitialSurebet?: () => void;
  defaultStake?: number;
  defaultRoundingMode?: RoundingMode;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({
  initialSurebet,
  onClearInitialSurebet,
  defaultStake = 100000,
  defaultRoundingMode = 'none',
}) => {
  // Par défaut, le cas de test 1 du prompt : 2.20 / 3.80 / 4.50
  const [outcomes, setOutcomes] = useState<RawOutcomeInput[]>([
    {
      key: '1',
      label: 'Victoire 1 (ex: Paris SG)',
      odd: 2.20,
      bookmakerId: '1xbet',
      bookmakerName: '1xBet CI',
    },
    {
      key: 'X',
      label: 'Match Nul (X)',
      odd: 3.80,
      bookmakerId: 'premierbet',
      bookmakerName: 'Premier Bet CI',
    },
    {
      key: '2',
      label: 'Victoire 2 (ex: Man City)',
      odd: 4.50,
      bookmakerId: 'betclic',
      bookmakerName: 'Betclic',
    },
  ]);

  const [totalStake, setTotalStake] = useState<number>(defaultStake);
  const [roundingMode, setRoundingMode] = useState<RoundingMode>(defaultRoundingMode);
  const [matchContextTitle, setMatchContextTitle] = useState<string>(
    'Cas d\'école 3 Issues · Cotes 2.20 / 3.80 / 4.50'
  );

  // Prise en compte d'un surebet injecté depuis le scanner
  useEffect(() => {
    if (initialSurebet) {
      setMatchContextTitle(`${initialSurebet.competition} · ${initialSurebet.homeTeam} vs ${initialSurebet.awayTeam}`);
      setOutcomes(
        initialSurebet.outcomes.map((o) => ({
          key: o.key,
          label: o.label,
          odd: o.odd,
          bookmakerId: o.bookmakerId,
          bookmakerName: o.bookmakerName,
          officialUrl: o.officialUrl,
        }))
      );
    }
  }, [initialSurebet]);

  // Calcul mathématique déterministe via ArbitrageEngine
  const calculation: CalculationResult = useMemo(() => {
    return ArbitrageEngine.calculateStakes(outcomes, totalStake, roundingMode);
  }, [outcomes, totalStake, roundingMode]);

  const handleOddChange = (index: number, val: string) => {
    const num = parseFloat(val);
    const updated = [...outcomes];
    updated[index] = { ...updated[index], odd: isNaN(num) ? 0 : num };
    setOutcomes(updated);
  };

  const handleLabelChange = (index: number, val: string) => {
    const updated = [...outcomes];
    updated[index] = { ...updated[index], label: val };
    setOutcomes(updated);
  };

  const handleBookmakerChange = (index: number, val: string) => {
    const updated = [...outcomes];
    updated[index] = { ...updated[index], bookmakerName: val };
    setOutcomes(updated);
  };

  const addOutcome = () => {
    if (outcomes.length >= 6) return;
    const nextIdx = outcomes.length + 1;
    setOutcomes([
      ...outcomes,
      {
        key: `Issue ${nextIdx}`,
        label: `Issue ${nextIdx}`,
        odd: 3.5,
        bookmakerId: 'sportcash',
        bookmakerName: 'Sportcash CI',
      },
    ]);
  };

  const removeOutcome = (index: number) => {
    if (outcomes.length <= 2) return;
    setOutcomes(outcomes.filter((_, i) => i !== index));
  };

  // Chargement des cas limites imposés par le cahier des charges
  const loadTestCase = (testCase: 'case1' | 'case2' | 'case3' | 'case4' | 'case5' | 'case7') => {
    if (onClearInitialSurebet) onClearInitialSurebet();

    switch (testCase) {
      case 'case1':
        setMatchContextTitle('Cas 1 : Arbitrage à trois issues (2.20 / 3.80 / 4.50)');
        setTotalStake(100000);
        setRoundingMode('none');
        setOutcomes([
          { key: '1', label: 'Issue 1 (2.20)', odd: 2.20, bookmakerId: '1xbet', bookmakerName: '1xBet CI' },
          { key: 'X', label: 'Issue X (3.80)', odd: 3.80, bookmakerId: 'premierbet', bookmakerName: 'Premier Bet' },
          { key: '2', label: 'Issue 2 (4.50)', odd: 4.50, bookmakerId: 'betclic', bookmakerName: 'Betclic' },
        ]);
        break;
      case 'case2':
        setMatchContextTitle('Cas 2 : Marché sans arbitrage (2.10 / 3.10 / 3.20)');
        setTotalStake(100000);
        setOutcomes([
          { key: '1', label: 'Issue 1', odd: 2.10, bookmakerId: 'sportcash', bookmakerName: 'Sportcash CI' },
          { key: 'X', label: 'Issue X', odd: 3.10, bookmakerId: '1xbet', bookmakerName: '1xBet' },
          { key: '2', label: 'Issue 2', odd: 3.20, bookmakerId: 'premierbet', bookmakerName: 'Premier Bet' },
        ]);
        break;
      case 'case3':
        setMatchContextTitle('Cas 3 : Arbitrage à deux issues (1.95 / 2.20)');
        setTotalStake(50000);
        setOutcomes([
          { key: '1', label: 'Joueur A (1.95)', odd: 1.95, bookmakerId: 'premierbet', bookmakerName: 'Premier Bet CI' },
          { key: '2', label: 'Joueur B (2.20)', odd: 2.20, bookmakerId: 'melbet', bookmakerName: 'Melbet' },
        ]);
        break;
      case 'case4':
        setMatchContextTitle('Cas 4 : Arbitrage à quatre issues (4.80 / 4.80 / 4.80 / 4.80)');
        setTotalStake(40000);
        setOutcomes([
          { key: 'Q1', label: 'Quart 1', odd: 4.80, bookmakerId: '1xbet', bookmakerName: '1xBet CI' },
          { key: 'Q2', label: 'Quart 2', odd: 4.80, bookmakerId: 'betclic', bookmakerName: 'Betclic' },
          { key: 'Q3', label: 'Quart 3', odd: 4.80, bookmakerId: 'betway', bookmakerName: 'Betway' },
          { key: 'Q4', label: 'Quart 4', odd: 4.80, bookmakerId: 'premierbet', bookmakerName: 'Premier Bet' },
        ]);
        break;
      case 'case5':
        setMatchContextTitle('Cas 5 : Rejet de cote invalide (1.00 ou négative)');
        setOutcomes([
          { key: '1', label: 'Cote invalide (1.00)', odd: 1.00, bookmakerId: '1xbet', bookmakerName: '1xBet CI' },
          { key: '2', label: 'Issue 2 (2.50)', odd: 2.50, bookmakerId: 'betway', bookmakerName: 'Betway' },
        ]);
        break;
      case 'case7':
        setMatchContextTitle('Cas 7 : Budget non divisible uniformément (10 003 FCFA)');
        setTotalStake(10003);
        setRoundingMode('none');
        setOutcomes([
          { key: '1', label: 'Issue 1 (2.20)', odd: 2.20, bookmakerId: '1xbet', bookmakerName: '1xBet CI' },
          { key: 'X', label: 'Issue X (3.80)', odd: 3.80, bookmakerId: 'premierbet', bookmakerName: 'Premier Bet' },
          { key: '2', label: 'Issue 2 (4.50)', odd: 4.50, bookmakerId: 'betclic', bookmakerName: 'Betclic' },
        ]);
        break;
    }
  };

  const quickBudgets = [10000, 25000, 50000, 100000, 250000, 500000];

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Moteur Mathématique Déterministe</span>
            <span aria-hidden="true">·</span>
            <span>Mises en FCFA</span>
            <span aria-hidden="true">·</span>
            <span>Égalisation des Retours & Pire Cas</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white font-display">
            Calculateur d'Arbitrage Sportif (Surebet)
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {matchContextTitle}
          </p>
        </div>

        {/* Boutons des tests automatisés obligatoires */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 px-2 shrink-0">Cas de test :</span>
          <button
            onClick={() => loadTestCase('case1')}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 whitespace-nowrap"
          >
            Cas 1 : 2.20 / 3.80 / 4.50
          </button>
          <button
            onClick={() => loadTestCase('case2')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 text-slate-200 hover:text-white whitespace-nowrap"
          >
            Cas 2 : Sans Arbitrage
          </button>
          <button
            onClick={() => loadTestCase('case3')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 text-slate-200 hover:text-white whitespace-nowrap"
          >
            Cas 3 : 2 Issues
          </button>
          <button
            onClick={() => loadTestCase('case4')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 text-slate-200 hover:text-white whitespace-nowrap"
          >
            Cas 4 : 4 Issues
          </button>
          <button
            onClick={() => loadTestCase('case5')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 text-amber-300 hover:text-white whitespace-nowrap"
          >
            Cas 5 : Cote Invalide
          </button>
          <button
            onClick={() => loadTestCase('case7')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 text-slate-200 hover:text-white whitespace-nowrap"
          >
            Cas 7 : Budget 10 003 FCFA
          </button>
        </div>
      </div>

      {/* Messages d'erreur de validation (Rejet strict) */}
      {calculation.validationErrors.length > 0 && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200 space-y-1">
          <div className="flex items-center gap-2 font-bold text-rose-400">
            <AlertCircle className="h-4 w-4" />
            <span>Erreur de Validation : Données Invalides Rejetées</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-rose-200/90 pl-1 text-[11px]">
            {calculation.validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* STATUT CLAIR : Arbitrage théorique détecté OU Aucun arbitrage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Statut d'arbitrage */}
        <div
          className={`rounded-xl border p-4 flex items-center justify-between ${
            calculation.isArbitrage
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-slate-800 bg-slate-900/60 text-slate-300'
          }`}
        >
          <div className="space-y-0.5">
            <div className="text-[11px] font-medium text-slate-400">Statut du Marché</div>
            <div
              className={`text-lg font-bold font-display ${
                calculation.isArbitrage ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {calculation.isArbitrage
                ? 'Arbitrage théorique détecté'
                : 'Aucun arbitrage'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {calculation.isArbitrage ? 'S < 1.0000' : 'S ≥ 1.0000'}
            </div>
          </div>
          {calculation.isArbitrage ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </span>
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-500">
              <Scale className="h-6 w-6" />
            </span>
          )}
        </div>

        {/* Somme des inverses (S) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Somme des Inverses (S)</span>
            <span className="font-mono text-slate-500">∑(1/Cᵢ)</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {calculation.sumOfInverses.toFixed(5)}
          </div>
          <div className="text-[10px] text-slate-400">
            {calculation.isArbitrage ? 'Marge marché négative (favorable)' : 'Marge bookmakers positive'}
          </div>
        </div>

        {/* Rendement théorique (%) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Rendement Théorique</span>
            <span className="font-mono text-slate-500">(1/S - 1) × 100</span>
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              calculation.theoreticalYieldPercent > 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatPercent(calculation.theoreticalYieldPercent)}
          </div>
          <div className="text-[10px] text-slate-400">
            Bénéfice brut théorique : {formatFcfa(calculation.theoreticalGrossProfit)}
          </div>
        </div>
      </div>

      {/* Disposition principale : Formulaire & Résultats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne gauche : Paramètres du Capital & Arrondi */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Budget Total (B)</h2>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {formatFcfa(totalStake)}
              </span>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Montant en FCFA</label>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={totalStake || ''}
                  onChange={(e) => setTotalStake(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                  FCFA
                </span>
              </div>
            </div>

            {/* Presets rapides de montant */}
            <div className="flex flex-wrap gap-1.5">
              {quickBudgets.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setTotalStake(b)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors ${
                    totalStake === b
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {formatFcfa(b)}
                </button>
              ))}
            </div>

            {/* Règle d'arrondi des mises */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-400">
                  Règle d'Arrondi des Mises (FCFA)
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">
                  ∑ Mises = Budget ({formatFcfa(calculation.actualTotalStake)})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(
                  [
                    { id: 'none', label: 'Au franc', desc: 'Exact (Recommandé)' },
                    { id: '100', label: 'Arrondi 100', desc: 'Standard' },
                    { id: '500', label: 'Arrondi 500', desc: 'Discret' },
                    { id: '1000', label: 'Arrondi 1 000', desc: 'Sécurisé' },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoundingMode(r.id)}
                    className={`p-2 text-center rounded border transition-colors ${
                      roundingMode === r.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs">{r.label}</div>
                    <div className="text-[10px] text-slate-500">{r.desc}</div>
                  </button>
                ))}
              </div>

              <p className="mt-2 text-[11px] text-slate-400 leading-normal">
                Les reliquats d'arrondis sont répartis de façon déterministe sur les issues à plus faible retour afin de maximiser le pire des cas et d'égaliser les gains possibles.
              </p>
            </div>
          </div>

          {/* Synthèse des retours idéaux vs réels */}
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Analyse Théorique & Pire Cas Réel
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Retour Égalisé Idéal</div>
                <div className="text-base font-bold font-mono text-white mt-0.5 tabular-nums">
                  {formatFcfa(calculation.theoreticalEqualizedGrossReturn)}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Formule : B / S</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Pire Bénéfice (Post-Arrondi)</div>
                <div
                  className={`text-base font-bold font-mono mt-0.5 tabular-nums ${
                    calculation.worstCaseNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {calculation.worstCaseNetProfit >= 0 ? '+' : ''}
                  {formatFcfa(calculation.worstCaseNetProfit)}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  R.O.I. : {formatPercent(calculation.worstCaseRoiPercent)}
                </div>
              </div>
            </div>

            {/* Avertissement Palpable Error */}
            {calculation.palpRiskDetected && (
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300">Alerte Erreur Manifeste (Palpable Error)</span>
                  <p className="mt-0.5 text-amber-200/80 text-[11px]">
                    L'écart de cote anormal (&gt; 20%) indique une probable inversion de cote par le bookmaker. Risque très élevé d'annulation unilatérale du pari !
                  </p>
                </div>
              </div>
            )}

            {/* Explication des limites */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs text-slate-400">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-slate-400" />
                <span>Explication des Limites Pratiques</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                <li>
                  <strong>Non-garantie :</strong> Les retours calculés sont purement théoriques et ne constituent jamais un gain garanti.
                </li>
                <li>
                  <strong>Fluctuation temporelle :</strong> Entre la pose du 1er et du 2e pari, une cote peut chuter.
                </li>
                <li>
                  <strong>Plafonds bookmaker :</strong> Les limites de mise individuelles chez 1xBet, Sportcash ou Premier Bet peuvent empêcher d'engager la mise idéale.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Colonne droite : Saisie des Cotes et Tableau des Mises */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Issues & Cotes Décimales (Cᵢ)</h2>
                <p className="text-xs text-slate-400">
                  Saisissez les cotes décimales strictement supérieures à 1.00.
                </p>
              </div>

              {outcomes.length < 6 && (
                <button
                  type="button"
                  onClick={addOutcome}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  <Plus className="h-3 w-3" />
                  <span>Ajouter une issue</span>
                </button>
              )}
            </div>

            {/* Formulaire de saisie des issues */}
            <div className="space-y-2.5">
              {outcomes.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">
                      Issue {index + 1}
                    </span>
                    {outcomes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOutcome(index)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                        title="Supprimer cette issue"
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
                        value={item.bookmakerName || ''}
                        onChange={(e) => handleBookmakerChange(index, e.target.value)}
                        className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">
                        Cote Décimale Cᵢ (&gt; 1.00)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1.01"
                        value={item.odd || ''}
                        onChange={(e) => handleOddChange(index, e.target.value)}
                        className={`w-full rounded border bg-slate-900 px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none ${
                          item.odd <= 1.0
                            ? 'border-rose-500 text-rose-400'
                            : 'border-slate-800 text-white focus:border-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tableau complet de répartition et recalcul post-arrondis */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Répartition des Mises & Retours Bruts par Issue
                </h3>
                <span className="text-[11px] font-mono text-emerald-400">
                  Somme Mises = {formatFcfa(calculation.actualTotalStake)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-[11px] text-slate-400">
                    <tr>
                      <th className="pb-2 font-medium">Issue</th>
                      <th className="pb-2 font-medium">Bookmaker</th>
                      <th className="pb-2 font-medium text-right">Cote (Cᵢ)</th>
                      <th className="pb-2 font-medium text-right">Prob. Norm.</th>
                      <th className="pb-2 font-medium text-right">Mise Entière (Mᵢ)</th>
                      <th className="pb-2 font-medium text-right">Retour Brut</th>
                      <th className="pb-2 font-medium text-right">Bénéfice Réel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {calculation.items.map((it, idx) => {
                      const isWorst = it.netProfit === calculation.worstCaseNetProfit;

                      return (
                        <tr key={idx} className={`hover:bg-slate-800/30 ${isWorst ? 'bg-amber-500/5' : ''}`}>
                          <td className="py-2.5 font-sans font-medium text-white">
                            {it.label}
                            {isWorst && (
                              <span className="ml-1 text-[9px] text-amber-400 font-sans border border-amber-500/30 px-1 rounded">
                                Pire cas
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 font-sans text-slate-400">{it.bookmakerName}</td>
                          <td className="py-2.5 text-right font-bold text-white tabular-nums">
                            {it.odd > 0 ? it.odd.toFixed(2) : '-'}
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-slate-400 text-[11px]">
                            {it.normalizedProbabilityPercent > 0
                              ? `${it.normalizedProbabilityPercent.toFixed(1)}%`
                              : '-'}
                          </td>
                          <td className="py-2.5 text-right font-bold text-emerald-400 tabular-nums">
                            {formatFcfa(it.roundedStake)}
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-slate-200">
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
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bilan financier post-arrondis */}
              <div className="mt-4 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px] text-slate-400">Total Alloué en FCFA</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5 tabular-nums">
                    {formatFcfa(calculation.actualTotalStake)}
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Exactement égal au budget ({formatFcfa(totalStake)})
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400">Pire Retour Brut</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5 tabular-nums">
                    {formatFcfa(calculation.worstCasePayout)}
                  </div>
                  <div className="text-[10px] text-slate-400">Parmi toutes les issues</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400">Pire Bénéfice Réel</div>
                  <div
                    className={`text-base font-bold font-mono mt-0.5 tabular-nums ${
                      calculation.worstCaseNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {calculation.worstCaseNetProfit >= 0 ? '+' : ''}
                    {formatFcfa(calculation.worstCaseNetProfit)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    R.O.I. effectif : {formatPercent(calculation.worstCaseRoiPercent)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
