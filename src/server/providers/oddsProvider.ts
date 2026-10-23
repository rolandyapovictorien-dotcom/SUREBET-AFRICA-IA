import {
  SportId,
  SurebetOpportunity,
  ProviderStatus,
  OddsSnapshot,
  HistoryOpportunity,
  ScannerStats,
  RejectedEventSummary,
} from '../../types/surebet';
import { ArbitrageEngine } from '../../engine/arbitrageEngine';
import { BOOKMAKERS_REGISTRY, SPORTS_REGISTRY } from '../../data/bookmakers';

export interface IOddsProvider {
  id: string;
  name: string;
  supportedSports: SportId[];
  isRealProvider: boolean;
  getStatus(): ProviderStatus;
  supportsSport(sportId: SportId): boolean;
  getSurebets(sportId?: SportId, liveOnly?: boolean, maxFreshnessMinutes?: number): Promise<SurebetOpportunity[]>;
  getScannerAudit?(sportId?: SportId): Promise<{ stats: ScannerStats; rejectedEvents: RejectedEventSummary[] }>;
  getMatchOdds(eventId: string): Promise<OddsSnapshot | null>;
  getAllMatchesOdds(sportId?: SportId): Promise<OddsSnapshot[]>;
  getHistoricalOpportunities(): Promise<HistoryOpportunity[]>;
}

/**
 * Fournisseur Déterministe de Démonstration (Phase 1)
 * Toutes les données sont explicitement identifiées "DÉMONSTRATION — NON VÉRIFIÉE".
 */
export class DemoDeterministicProvider implements IOddsProvider {
  public id = 'demo-deterministic';
  public name = 'Moteur de Démonstration Déterministe (Local)';
  public supportedSports: SportId[] = [
    'football',
    'basketball',
    'tennis',
    'volleyball',
    'hockey',
    'rugby',
    'baseball',
    'cricket',
    'mma',
  ];
  public isRealProvider = false;
  private requestsToday = 184;
  private dailyQuota = 10000;

  public supportsSport(sportId: SportId): boolean {
    return this.supportedSports.includes(sportId);
  }

  public getStatus(): ProviderStatus {
    return {
      id: this.id,
      name: this.name,
      type: 'DEMO_DETERMINISTIC',
      status: 'active',
      latencyMs: 8,
      requestsUsedToday: this.requestsToday,
      dailyQuota: this.dailyQuota,
      lastUpdated: new Date().toISOString(),
      description:
        'Données déterministes mathématiques de test. Idéal pour valider le calculateur et l\'interface sans consommer de quotas payants.',
    };
  }

  /**
   * Génère la liste des opportunités de surebet théoriques réalistes
   */
  public async getSurebets(
    sportId?: SportId,
    liveOnly?: boolean
  ): Promise<SurebetOpportunity[]> {
    this.requestsToday++;
    const now = Date.now();

    const rawList: Omit<
      SurebetOpportunity,
      'sumOfInverses' | 'theoreticalYieldPercent' | 'collectedAt' | 'providerUpdatedAt' | 'validationStatus' | 'validationMessage'
    >[] = [
      {
        id: 'arb-uefa-01',
        sportId: 'football',
        sportName: 'Football',
        competition: 'UEFA Champions League · Quarts',
        homeTeam: 'Paris Saint-Germain',
        awayTeam: 'Manchester City',
        startTime: new Date(now + 3600 * 1000 * 4).toISOString(),
        isLive: false,
        marketType: '1X2',
        marketLabel: 'Résultat du Match (1X2)',
        outcomes: [
          {
            key: '1',
            label: 'Paris SG (1)',
            odd: 2.85,
            bookmakerId: '1xbet',
            bookmakerName: '1xBet CI',
            officialUrl: 'https://1xbet.ci',
            timestamp: new Date(now - 1000 * 45).toISOString(),
          },
          {
            key: 'X',
            label: 'Match Nul (X)',
            odd: 3.80,
            bookmakerId: 'premierbet',
            bookmakerName: 'Premier Bet CI',
            officialUrl: 'https://www.premierbet.ci',
            timestamp: new Date(now - 1000 * 60).toISOString(),
          },
          {
            key: '2',
            label: 'Man City (2)',
            odd: 2.90,
            bookmakerId: 'betclic',
            bookmakerName: 'Betclic',
            officialUrl: 'https://www.betclic.com',
            timestamp: new Date(now - 1000 * 30).toISOString(),
          },
        ],
        freshnessSeconds: 30,
        detectedAt: new Date(now - 1000 * 120).toISOString(),
        riskLevel: 'FAIBLE',
        isDemoData: true,
      },
      {
        id: 'arb-civ-02',
        sportId: 'football',
        sportName: 'Football',
        competition: 'Ligue 1 Côte d\'Ivoire (LONACI)',
        homeTeam: 'ASEC Mimosas',
        awayTeam: 'Africa Sports d\'Abidjan',
        startTime: new Date(now - 1000 * 60 * 35).toISOString(),
        isLive: true,
        liveScore: '1 - 0',
        liveMinute: "38'",
        marketType: 'OVER_UNDER_2_5',
        marketLabel: 'Total Buts Plus/Moins 2.5',
        outcomes: [
          {
            key: 'Over',
            label: 'Plus de 2.5 Buts',
            odd: 2.30,
            bookmakerId: 'sportcash',
            bookmakerName: 'Sportcash CI (LONACI)',
            officialUrl: 'https://sportcash.lonaci.ci',
            timestamp: new Date(now - 1000 * 15).toISOString(),
          },
          {
            key: 'Under',
            label: 'Moins de 2.5 Buts',
            odd: 1.88,
            bookmakerId: '1xbet',
            bookmakerName: '1xBet CI',
            officialUrl: 'https://1xbet.ci',
            timestamp: new Date(now - 1000 * 12).toISOString(),
          },
        ],
        freshnessSeconds: 12,
        detectedAt: new Date(now - 1000 * 40).toISOString(),
        riskLevel: 'FAIBLE',
        isDemoData: true,
      },
      {
        id: 'arb-nba-03',
        sportId: 'basketball',
        sportName: 'Basketball',
        competition: 'NBA · Playoffs Conférence Est',
        homeTeam: 'Boston Celtics',
        awayTeam: 'Milwaukee Bucks',
        startTime: new Date(now + 3600 * 1000 * 7).toISOString(),
        isLive: false,
        marketType: 'MONEYLINE_12',
        marketLabel: 'Vainqueur du Match (Face-à-Face)',
        outcomes: [
          {
            key: '1',
            label: 'Boston Celtics',
            odd: 1.72,
            bookmakerId: 'betway',
            bookmakerName: 'Betway Africa',
            officialUrl: 'https://www.betway.com',
            timestamp: new Date(now - 1000 * 90).toISOString(),
          },
          {
            key: '2',
            label: 'Milwaukee Bucks',
            odd: 2.65,
            bookmakerId: 'betwinner',
            bookmakerName: 'Betwinner',
            officialUrl: 'https://betwinner.com',
            timestamp: new Date(now - 1000 * 75).toISOString(),
          },
        ],
        freshnessSeconds: 75,
        detectedAt: new Date(now - 1000 * 180).toISOString(),
        riskLevel: 'FAIBLE',
        isDemoData: true,
      },
      {
        id: 'arb-tennis-04',
        sportId: 'tennis',
        sportName: 'Tennis',
        competition: 'Roland Garros · Simple Messieurs',
        homeTeam: 'Carlos Alcaraz',
        awayTeam: 'Jannik Sinner',
        startTime: new Date(now - 1000 * 60 * 50).toISOString(),
        isLive: true,
        liveScore: '6-4, 3-2',
        liveMinute: '2e Set',
        marketType: 'MONEYLINE_12',
        marketLabel: 'Vainqueur de la Rencontre',
        outcomes: [
          {
            key: '1',
            label: 'Carlos Alcaraz',
            odd: 1.68,
            bookmakerId: 'premierbet',
            bookmakerName: 'Premier Bet CI',
            officialUrl: 'https://www.premierbet.ci',
            timestamp: new Date(now - 1000 * 10).toISOString(),
          },
          {
            key: '2',
            label: 'Jannik Sinner',
            odd: 2.75,
            bookmakerId: 'melbet',
            bookmakerName: 'Melbet',
            officialUrl: 'https://melbet.com',
            timestamp: new Date(now - 1000 * 8).toISOString(),
          },
        ],
        freshnessSeconds: 8,
        detectedAt: new Date(now - 1000 * 25).toISOString(),
        riskLevel: 'FAIBLE',
        isDemoData: true,
      },
      {
        id: 'arb-mma-05',
        sportId: 'mma',
        sportName: 'MMA / UFC',
        competition: 'UFC 312 · Poids Lourds',
        homeTeam: 'Ciryl Gane',
        awayTeam: 'Tom Aspinall',
        startTime: new Date(now + 3600 * 1000 * 28).toISOString(),
        isLive: false,
        marketType: 'MONEYLINE_12',
        marketLabel: 'Vainqueur du Combat',
        outcomes: [
          {
            key: '1',
            label: 'Ciryl Gane',
            odd: 2.50,
            bookmakerId: 'sportcash',
            bookmakerName: 'Sportcash CI',
            officialUrl: 'https://sportcash.lonaci.ci',
            timestamp: new Date(now - 1000 * 200).toISOString(),
          },
          {
            key: '2',
            label: 'Tom Aspinall',
            odd: 1.76,
            bookmakerId: '1xbet',
            bookmakerName: '1xBet CI',
            officialUrl: 'https://1xbet.ci',
            timestamp: new Date(now - 1000 * 150).toISOString(),
          },
        ],
        freshnessSeconds: 150,
        detectedAt: new Date(now - 1000 * 400).toISOString(),
        riskLevel: 'FAIBLE',
        isDemoData: true,
      },
      {
        id: 'arb-volleyball-06',
        sportId: 'volleyball',
        sportName: 'Volleyball',
        competition: 'Ligue des Nations FIVB',
        homeTeam: 'Pologne',
        awayTeam: 'Italie',
        startTime: new Date(now - 1000 * 60 * 15).toISOString(),
        isLive: true,
        liveScore: '25-22, 18-25, 12-9',
        liveMinute: '3e Set',
        marketType: 'MONEYLINE_12',
        marketLabel: 'Vainqueur du Match',
        outcomes: [
          {
            key: '1',
            label: 'Pologne',
            odd: 1.75,
            bookmakerId: 'betclic',
            bookmakerName: 'Betclic',
            officialUrl: 'https://www.betclic.com',
            timestamp: new Date(now - 1000 * 20).toISOString(),
          },
          {
            key: '2',
            label: 'Italie',
            odd: 2.60,
            bookmakerId: '1xbet',
            bookmakerName: '1xBet CI',
            officialUrl: 'https://1xbet.ci',
            timestamp: new Date(now - 1000 * 18).toISOString(),
          },
        ],
        freshnessSeconds: 18,
        detectedAt: new Date(now - 1000 * 50).toISOString(),
        riskLevel: 'FAIBLE',
        isDemoData: true,
      },
      {
        id: 'arb-hockey-07',
        sportId: 'hockey',
        sportName: 'Hockey sur Glace',
        competition: 'LNH · Finale Conférence Ouest',
        homeTeam: 'Edmonton Oilers',
        awayTeam: 'Florida Panthers',
        startTime: new Date(now + 3600 * 1000 * 9).toISOString(),
        isLive: false,
        marketType: 'MONEYLINE_12',
        marketLabel: 'Vainqueur (Prolongation incluse)',
        outcomes: [
          {
            key: '1',
            label: 'Edmonton Oilers',
            odd: 1.85,
            bookmakerId: 'betway',
            bookmakerName: 'Betway Africa',
            officialUrl: 'https://www.betway.com',
            timestamp: new Date(now - 1000 * 110).toISOString(),
          },
          {
            key: '2',
            label: 'Florida Panthers',
            odd: 2.35,
            bookmakerId: 'sportcash',
            bookmakerName: 'Sportcash CI',
            officialUrl: 'https://sportcash.lonaci.ci',
            timestamp: new Date(now - 1000 * 95).toISOString(),
          },
        ],
        freshnessSeconds: 95,
        detectedAt: new Date(now - 1000 * 250).toISOString(),
        riskLevel: 'FAIBLE',
        isDemoData: true,
      },
      {
        id: 'arb-rugby-08',
        sportId: 'rugby',
        sportName: 'Rugby',
        competition: 'Top 14 · France',
        homeTeam: 'Stade Toulousain',
        awayTeam: 'Stade Rochelais',
        startTime: new Date(now + 3600 * 1000 * 18).toISOString(),
        isLive: false,
        marketType: 'MONEYLINE_12',
        marketLabel: 'Vainqueur du Match',
        outcomes: [
          {
            key: '1',
            label: 'Toulouse',
            odd: 1.62,
            bookmakerId: 'sportcash',
            bookmakerName: 'Sportcash CI',
            officialUrl: 'https://sportcash.lonaci.ci',
            timestamp: new Date(now - 1000 * 120).toISOString(),
          },
          {
            key: '2',
            label: 'La Rochelle',
            odd: 2.85,
            bookmakerId: 'betway',
            bookmakerName: 'Betway Africa',
            officialUrl: 'https://www.betway.com',
            timestamp: new Date(now - 1000 * 110).toISOString(),
          },
        ],
        freshnessSeconds: 110,
        detectedAt: new Date(now - 1000 * 300).toISOString(),
        riskLevel: 'FAIBLE',
        isDemoData: true,
      },
      {
        id: 'arb-baseball-09',
        sportId: 'baseball',
        sportName: 'Baseball',
        competition: 'MLB · World Series',
        homeTeam: 'New York Yankees',
        awayTeam: 'Los Angeles Dodgers',
        startTime: new Date(now + 3600 * 1000 * 14).toISOString(),
        isLive: false,
        marketType: 'MONEYLINE_12',
        marketLabel: 'Moneyline (Vainqueur)',
        outcomes: [
          {
            key: '1',
            label: 'NY Yankees',
            odd: 2.15,
            bookmakerId: '1xbet',
            bookmakerName: '1xBet CI',
            officialUrl: 'https://1xbet.ci',
            timestamp: new Date(now - 1000 * 70).toISOString(),
          },
          {
            key: '2',
            label: 'LA Dodgers',
            odd: 1.98,
            bookmakerId: 'premierbet',
            bookmakerName: 'Premier Bet CI',
            officialUrl: 'https://www.premierbet.ci',
            timestamp: new Date(now - 1000 * 65).toISOString(),
          },
        ],
        freshnessSeconds: 65,
        detectedAt: new Date(now - 1000 * 160).toISOString(),
        riskLevel: 'FAIBLE',
        isDemoData: true,
      },
      {
        id: 'arb-cricket-10',
        sportId: 'cricket',
        sportName: 'Cricket',
        competition: 'ICC T20 World Cup',
        homeTeam: 'Inde',
        awayTeam: 'Australie',
        startTime: new Date(now + 3600 * 1000 * 22).toISOString(),
        isLive: false,
        marketType: 'MONEYLINE_12',
        marketLabel: 'Vainqueur du Match',
        outcomes: [
          {
            key: '1',
            label: 'Inde',
            odd: 1.80,
            bookmakerId: 'melbet',
            bookmakerName: 'Melbet',
            officialUrl: 'https://melbet.com',
            timestamp: new Date(now - 1000 * 140).toISOString(),
          },
          {
            key: '2',
            label: 'Australie',
            odd: 2.45,
            bookmakerId: 'betwinner',
            bookmakerName: 'Betwinner',
            officialUrl: 'https://betwinner.com',
            timestamp: new Date(now - 1000 * 130).toISOString(),
          },
        ],
        freshnessSeconds: 130,
        detectedAt: new Date(now - 1000 * 350).toISOString(),
        riskLevel: 'FAIBLE',
        isDemoData: true,
      },
    ];

    // Calcul mathématique rigoureux de S, Yield et validation de fraîcheur
    const processed: SurebetOpportunity[] = rawList.map((arb) => {
      const odds = arb.outcomes.map((o) => o.odd);
      const sumOfInverses = ArbitrageEngine.calculateSumOfInverses(odds);
      const yieldPercent = ArbitrageEngine.calculateYield(sumOfInverses);
      const palpCheck = ArbitrageEngine.detectPalpRisk(sumOfInverses, odds);

      const providerUpdatedAt = arb.outcomes[0]?.timestamp || new Date(now - arb.freshnessSeconds * 1000).toISOString();
      const freshnessCheck = ArbitrageEngine.checkOddsFreshness(providerUpdatedAt, 30);

      let settlementRule = 'Temps réglementaire 90 min (hors prolongations)';
      if (arb.sportId === 'basketball' || arb.sportId === 'baseball') {
        settlementRule = 'Vainqueur final de la rencontre (prolongations/extra innings incluses)';
      } else if (arb.sportId === 'tennis' || arb.sportId === 'mma') {
        settlementRule = 'Vainqueur de la rencontre selon règlement officiel de l\'ATP/UFC';
      } else if (arb.marketType === 'OVER_UNDER_2_5' || arb.marketType === 'BTTS') {
        settlementRule = 'Temps réglementaire (90 min + temps additionnel)';
      }

      return {
        ...arb,
        sumOfInverses: Number(sumOfInverses.toFixed(5)),
        theoreticalYieldPercent: Number(yieldPercent.toFixed(2)),
        riskLevel: palpCheck.riskLevel,
        riskReason: palpCheck.reason,
        collectedAt: new Date(now).toISOString(),
        providerUpdatedAt,
        settlementRule,
        isExpired: freshnessCheck.isExpired,
        validationStatus: freshnessCheck.isExpired
          ? 'EXPIRED'
          : palpCheck.riskLevel === 'ALERTE_ERREUR_PALP'
          ? 'PALP_ALERT'
          : 'VALIDATED',
        validationMessage: freshnessCheck.isExpired
          ? `Périmée · L'âge de la cote (${freshnessCheck.ageMinutes} min) dépasse le seuil maximal`
          : `Vérifié · ${arb.outcomes.length} issues exhaustives · Bookmakers indépendants`,
      };
    });

    return processed.filter((item) => {
      if (sportId && item.sportId !== sportId) return false;
      if (liveOnly && !item.isLive) return false;
      return true;
    });
  }

  /**
   * Retourne l'audit de scan détaillé avec statistiques et motifs précis de rejet
   */
  public async getScannerAudit(sportId?: SportId): Promise<{
    stats: ScannerStats;
    rejectedEvents: RejectedEventSummary[];
  }> {
    const now = Date.now();
    const allRejected: RejectedEventSummary[] = [
      {
        id: 'rej-demo-01',
        fixtureId: 101,
        sportId: 'football',
        competition: 'La Liga · Espagne',
        match: 'FC Barcelone vs Real Madrid',
        marketType: '1X2',
        marketLabel: 'Résultat du Match (1X2)',
        reasonCode: 'NO_ARBITRAGE',
        reasonLabel: 'Aucun arbitrage mathématique : la marge cumulée dépasse 100% (S = 1.054, rendement = -5.12%)',
        bookmakersObserved: ['1xBet CI', 'Betclic', 'Premier Bet CI'],
        bestOddsFound: { '1': 2.30, 'X': 3.40, '2': 3.10 },
        sumOfInverses: 1.054,
        theoreticalYield: -5.12,
        providerUpdatedAt: new Date(now - 1000 * 180).toISOString(),
      },
      {
        id: 'rej-demo-02',
        fixtureId: 102,
        sportId: 'football',
        competition: 'Premier League · Angleterre',
        match: 'Arsenal vs Chelsea',
        marketType: '1X2',
        marketLabel: 'Résultat du Match (1X2)',
        reasonCode: 'INSUFFICIENT_BOOKMAKERS',
        reasonLabel: 'Moins de 2 bookmakers distincts comparables (1 seul bookmaker : Betclic présent)',
        bookmakersObserved: ['Betclic'],
        bestOddsFound: { '1': 1.95, 'X': 3.60, '2': 3.90 },
        sumOfInverses: 1.047,
        theoreticalYield: -4.49,
        providerUpdatedAt: new Date(now - 1000 * 240).toISOString(),
      },
      {
        id: 'rej-demo-03',
        fixtureId: 103,
        sportId: 'football',
        competition: 'Serie A · Italie',
        match: 'Juventus vs AC Milan',
        marketType: '1X2',
        marketLabel: 'Résultat du Match (1X2)',
        reasonCode: 'INCOMPLETE_OUTCOMES',
        reasonLabel: 'Marché 1X2 incomplet : l\'issue \'X\' (Match Nul) n\'est cotée chez aucun bookmaker',
        bookmakersObserved: ['1xBet CI', 'Sportcash CI'],
        bestOddsFound: { '1': 2.40, '2': 3.20 },
        providerUpdatedAt: new Date(now - 1000 * 300).toISOString(),
      },
      {
        id: 'rej-demo-04',
        fixtureId: 104,
        sportId: 'basketball',
        competition: 'NBA · Saison Régulière',
        match: 'Golden State Warriors vs Denver Nuggets',
        marketType: 'MONEYLINE_12',
        marketLabel: 'Vainqueur du Match (Face-à-Face)',
        reasonCode: 'EXPIRED_ODDS',
        reasonLabel: 'Cotes périmées : l\'âge des données (48 min) dépasse le seuil maximal de fraîcheur configuré',
        bookmakersObserved: ['Betway Africa', 'Betwinner'],
        bestOddsFound: { '1': 2.10, '2': 1.95 },
        sumOfInverses: 0.989,
        theoreticalYield: 1.11,
        providerUpdatedAt: new Date(now - 1000 * 2880).toISOString(),
      },
      {
        id: 'rej-demo-05',
        fixtureId: 105,
        sportId: 'football',
        competition: 'Serie A · Italie',
        match: 'Inter Milan vs Napoli',
        marketType: '1X2',
        marketLabel: 'Résultat 1X2 vs Draw-No-Bet',
        reasonCode: 'INCOMPATIBLE_RULES',
        reasonLabel: 'Marchés incompatibles : tentative de combiner un marché 3 issues (1X2) avec un marché 2 issues (Draw-No-Bet)',
        bookmakersObserved: ['1xBet CI', 'Betclic'],
        providerUpdatedAt: new Date(now - 1000 * 120).toISOString(),
      },
      {
        id: 'rej-demo-06',
        fixtureId: 106,
        sportId: 'football',
        competition: 'Ligue 1 · France',
        match: 'Olympique de Marseille vs Lyon',
        marketType: '1X2',
        marketLabel: 'Résultat du Match (1X2)',
        reasonCode: 'INVALID_ODDS',
        reasonLabel: 'Cote invalide détectée : la cote de l\'issue 1 est égale à 0.95 (doit être strictement supérieure à 1.00)',
        bookmakersObserved: ['Sportcash CI', '1xBet CI'],
        providerUpdatedAt: new Date(now - 1000 * 90).toISOString(),
      },
    ];

    const filtered = sportId ? allRejected.filter((r) => r.sportId === sportId) : allRejected;

    const stats: ScannerStats = {
      totalScanned: 10 + filtered.length,
      validArbitragesCount: 10,
      rejectedCount: filtered.length,
      rejectedByReason: {
        INSUFFICIENT_BOOKMAKERS: filtered.filter((r) => r.reasonCode === 'INSUFFICIENT_BOOKMAKERS').length,
        INCOMPLETE_OUTCOMES: filtered.filter((r) => r.reasonCode === 'INCOMPLETE_OUTCOMES').length,
        INCOMPATIBLE_RULES: filtered.filter((r) => r.reasonCode === 'INCOMPATIBLE_RULES').length,
        INVALID_ODDS: filtered.filter((r) => r.reasonCode === 'INVALID_ODDS').length,
        EXPIRED_ODDS: filtered.filter((r) => r.reasonCode === 'EXPIRED_ODDS').length,
        FUTURE_TIMESTAMP: filtered.filter((r) => r.reasonCode === 'FUTURE_TIMESTAMP').length,
        MISSING_TIMESTAMP: filtered.filter((r) => r.reasonCode === 'MISSING_TIMESTAMP').length,
        NO_ARBITRAGE: filtered.filter((r) => r.reasonCode === 'NO_ARBITRAGE').length,
      },
    };

    return {
      stats,
      rejectedEvents: filtered,
    };
  }

  public async getHistoricalOpportunities(): Promise<HistoryOpportunity[]> {
    return [
      {
        id: 'hist-demo-01',
        match: 'Real Madrid vs Bayern Munich',
        competition: 'UEFA Champions League · Demi-Finale',
        sport: 'Football',
        sportIcon: '⚽',
        market: 'Résultat 1X2',
        yieldPercent: 3.42,
        sumOfInverses: 0.96693,
        durationMinutes: 14,
        detectedAt: '2026-10-20 04:15 UTC',
        closedAt: '2026-10-20 04:29 UTC',
        outcomes: [
          { label: 'Real Madrid', bookmaker: '1xBet CI', odd: 2.40 },
          { label: 'Nul', bookmaker: 'Premier Bet', odd: 3.75 },
          { label: 'Bayern Munich', bookmaker: 'Betclic', odd: 3.25 },
        ],
        resolutionNote: 'Cote Betclic réajustée de 3.25 à 2.95 après 14 minutes.',
        isDemoData: true,
      },
      {
        id: 'hist-demo-02',
        match: 'Los Angeles Lakers vs Golden State Warriors',
        competition: 'NBA · Saison Régulière',
        sport: 'Basketball',
        sportIcon: '🏀',
        market: 'Face-à-Face',
        yieldPercent: 2.18,
        sumOfInverses: 0.97866,
        durationMinutes: 48,
        detectedAt: '2026-10-19 23:30 UTC',
        closedAt: '2026-10-20 00:18 UTC',
        outcomes: [
          { label: 'LA Lakers', bookmaker: 'Betway Africa', odd: 1.82 },
          { label: 'Golden State', bookmaker: 'Betwinner', odd: 2.38 },
        ],
        resolutionNote: 'Pari validé avec succès par les traders avant match.',
        isDemoData: true,
      },
      {
        id: 'hist-demo-03',
        match: 'ASEC Mimosas vs Stella Club',
        competition: 'Ligue 1 Côte d\'Ivoire (LONACI)',
        sport: 'Football',
        sportIcon: '⚽',
        market: 'Plus/Moins de 2.5 Buts',
        yieldPercent: 4.85,
        sumOfInverses: 0.95374,
        durationMinutes: 6,
        detectedAt: '2026-10-19 16:20 UTC',
        closedAt: '2026-10-19 16:26 UTC',
        outcomes: [
          { label: 'Plus de 2.5', bookmaker: 'Sportcash CI', odd: 2.35 },
          { label: 'Moins de 2.5', bookmaker: '1xBet CI', odd: 1.89 },
        ],
        resolutionNote: 'Fermeture rapide du marché Sportcash après 6 minutes.',
        isDemoData: true,
      },
      {
        id: 'hist-demo-04',
        match: 'Novak Djokovic vs Rafael Nadal',
        competition: 'Roland Garros · Quarts de Finale',
        sport: 'Tennis',
        sportIcon: '🎾',
        market: 'Vainqueur du Match',
        yieldPercent: 1.95,
        sumOfInverses: 0.98087,
        durationMinutes: 32,
        detectedAt: '2026-10-19 12:10 UTC',
        closedAt: '2026-10-19 12:42 UTC',
        outcomes: [
          { label: 'N. Djokovic', bookmaker: 'Premier Bet CI', odd: 1.65 },
          { label: 'R. Nadal', bookmaker: 'Melbet', odd: 2.68 },
        ],
        resolutionNote: 'Ajustement d\'équilibre de mise standard.',
        isDemoData: true,
      },
      {
        id: 'hist-demo-05',
        match: 'Jon Jones vs Stipe Miocic',
        competition: 'UFC · Poids Lourds',
        sport: 'MMA / UFC',
        sportIcon: '🥊',
        market: 'Vainqueur du Combat',
        yieldPercent: 5.12,
        sumOfInverses: 0.95129,
        durationMinutes: 19,
        detectedAt: '2026-10-18 20:00 UTC',
        closedAt: '2026-10-18 20:19 UTC',
        outcomes: [
          { label: 'Jon Jones', bookmaker: 'Sportcash CI', odd: 1.55 },
          { label: 'Stipe Miocic', bookmaker: '1xBet CI', odd: 3.28 },
        ],
        resolutionNote: 'Volatilité des cotes sur les sports de combat.',
        isDemoData: true,
      },
    ];
  }

  public async getMatchOdds(eventId: string): Promise<OddsSnapshot | null> {
    const all = await this.getAllMatchesOdds();
    return all.find((m) => m.eventId === eventId) || null;
  }

  public async getAllMatchesOdds(sportId?: SportId): Promise<OddsSnapshot[]> {
    const now = Date.now();
    const matches: OddsSnapshot[] = [
      {
        eventId: 'match-uefa-cl-psg-mci',
        sportId: 'football',
        competition: 'UEFA Champions League',
        homeTeam: 'Paris Saint-Germain',
        awayTeam: 'Manchester City',
        startTime: new Date(now + 3600 * 1000 * 4).toISOString(),
        isLive: false,
        markets: [
          {
            marketType: '1X2',
            marketLabel: 'Résultat du Match (1X2)',
            bookmakerOdds: [
              {
                bookmakerId: '1xbet',
                bookmakerName: '1xBet CI',
                odds: { '1': 2.85, X: 3.45, '2': 2.65 },
                timestamp: new Date(now - 1000 * 45).toISOString(),
              },
              {
                bookmakerId: 'premierbet',
                bookmakerName: 'Premier Bet CI',
                odds: { '1': 2.70, X: 3.80, '2': 2.60 },
                timestamp: new Date(now - 1000 * 60).toISOString(),
              },
              {
                bookmakerId: 'sportcash',
                bookmakerName: 'Sportcash CI (LONACI)',
                odds: { '1': 2.75, X: 3.50, '2': 2.70 },
                timestamp: new Date(now - 1000 * 120).toISOString(),
              },
              {
                bookmakerId: 'betclic',
                bookmakerName: 'Betclic',
                odds: { '1': 2.65, X: 3.60, '2': 2.90 },
                timestamp: new Date(now - 1000 * 30).toISOString(),
              },
              {
                bookmakerId: 'betway',
                bookmakerName: 'Betway Africa',
                odds: { '1': 2.72, X: 3.55, '2': 2.75 },
                timestamp: new Date(now - 1000 * 90).toISOString(),
              },
            ],
          },
        ],
      },
      {
        eventId: 'match-ligue1-asec-africa',
        sportId: 'football',
        competition: 'Ligue 1 Côte d\'Ivoire (LONACI)',
        homeTeam: 'ASEC Mimosas',
        awayTeam: 'Africa Sports d\'Abidjan',
        startTime: new Date(now - 1000 * 60 * 35).toISOString(),
        isLive: true,
        liveScore: '1 - 0',
        liveMinute: "38'",
        markets: [
          {
            marketType: 'OVER_UNDER_2_5',
            marketLabel: 'Plus/Moins de 2.5 Buts',
            bookmakerOdds: [
              {
                bookmakerId: 'sportcash',
                bookmakerName: 'Sportcash CI (LONACI)',
                odds: { Over: 2.30, Under: 1.60 },
                timestamp: new Date(now - 1000 * 15).toISOString(),
              },
              {
                bookmakerId: '1xbet',
                bookmakerName: '1xBet CI',
                odds: { Over: 2.05, Under: 1.88 },
                timestamp: new Date(now - 1000 * 12).toISOString(),
              },
            ],
          },
        ],
      },
    ];

    if (sportId) {
      return matches.filter((m) => m.sportId === sportId);
    }
    return matches;
  }
}

import { TheOddsApiAdapter } from './theOddsApiAdapter';
import { ApiFootballAdapter } from './apiFootballAdapter';

export { TheOddsApiAdapter };

/**
 * Gestionnaire Centralisé des Fournisseurs de Cotes
 */
export class OddsProviderManager {
  private static instance: OddsProviderManager;
  private providers: IOddsProvider[] = [];
  private apiFootball = ApiFootballAdapter.getInstance();
  private theOddsApi = TheOddsApiAdapter.getInstance();

  private constructor() {
    this.providers.push(new DemoDeterministicProvider());
    this.providers.push(this.theOddsApi);
  }

  public static getInstance(): OddsProviderManager {
    if (!OddsProviderManager.instance) {
      OddsProviderManager.instance = new OddsProviderManager();
    }
    return OddsProviderManager.instance;
  }

  public getApiFootball(): ApiFootballAdapter {
    return this.apiFootball;
  }

  public getTheOddsApi(): TheOddsApiAdapter {
    return this.theOddsApi;
  }

  public getProviders(): IOddsProvider[] {
    return this.providers;
  }

  public getActiveProvider(): IOddsProvider {
    return this.providers[0];
  }

  public getProvidersStatus(): ProviderStatus[] {
    const statuses = this.providers.map((p) => p.getStatus());
    
    // Ajouter l'état d'API-Football
    const isConfigured = this.apiFootball.isKeyConfigured();
    statuses.push({
      id: 'api-football',
      name: 'API-Football (v3.football.api-sports.io)',
      type: 'SPORTMONKS', // Type agrégateur football
      status: isConfigured ? 'active' : 'missing_key',
      latencyMs: isConfigured ? 140 : 0,
      requestsUsedToday: 0,
      dailyQuota: 100,
      lastUpdated: new Date().toISOString(),
      description: isConfigured
        ? 'Connecteur officiel API-Football configuré côté serveur via APISPORTS_KEY.'
        : 'Clé APISPORTS_KEY non configurée. Définir le secret serveur pour activer les flux réels.',
    });

    return statuses;
  }
}

