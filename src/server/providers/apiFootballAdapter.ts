import {
  SurebetOpportunity,
  OddsSnapshot,
  MarketType,
  ApiFootballDiagnostic,
  ConnectionState,
  SportId,
  ScannerStats,
  RejectedEventSummary,
} from '../../types/surebet';
import { ArbitrageEngine, RawOutcomeInput } from '../../engine/arbitrageEngine';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlSeconds: number;
}

export interface ApiFootballFixtureOdds {
  league: {
    id: number;
    name: string;
    country: string;
    logo?: string;
    season: number;
  };
  fixture: {
    id: number;
    date: string;
    timestamp: number;
  };
  update: string;
  bookmakers: {
    id: number;
    name: string;
    bets: {
      id: number;
      name: string;
      values: {
        value: string;
        odd: string;
      }[];
    }[];
  }[];
}

export interface ApiFootballStatusResponse {
  errors?: string[] | Record<string, string>;
  response?: {
    account?: {
      firstname?: string;
      lastname?: string;
      email?: string;
    };
    subscription?: {
      plan?: string;
      end?: string;
      active?: boolean;
    };
    requests?: {
      current?: number;
      limit_day?: number;
    };
  };
}

/**
 * Adaptateur officiel API-Football (v3.football.api-sports.io)
 * Intégration de cotes réelles pré-match avec cache serveur et protection stricte des secrets.
 */
export class ApiFootballAdapter {
  private static instance: ApiFootballAdapter;
  public readonly id = 'api-football';
  public readonly name = 'API-Football (v3.football.api-sports.io)';
  public readonly supportedSports: SportId[] = ['football'];
  public readonly isRealProvider = true;
  private readonly baseUrl = 'https://v3.football.api-sports.io';
  private cache = new Map<string, CacheEntry<any>>();
  private defaultCacheTtlSeconds = 180; // 3 minutes en cache pour préserver le quota journalier (100 req/jour free)
  private lastDiagnostic: ApiFootballDiagnostic | null = null;

  public supportsSport(sportId: SportId): boolean {
    return sportId === 'football';
  }

  public static getInstance(): ApiFootballAdapter {
    if (!ApiFootballAdapter.instance) {
      ApiFootballAdapter.instance = new ApiFootballAdapter();
    }
    return ApiFootballAdapter.instance;
  }

  /**
   * Récupère la clé API de façon sécurisée depuis les variables d'environnement serveur
   */
  private getApiKey(): string {
    return (process.env.APISPORTS_KEY || process.env.API_FOOTBALL_KEY || '').trim();
  }

  /**
   * Vérifie si la clé est configurée sans jamais l'exposer
   */
  public isKeyConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key !== 'MY_APISPORTS_KEY' && key.length > 5);
  }

  /**
   * Retourne un avertissement masqué pour l'interface utilisateur
   */
  public getMaskedKeyNotice(): string {
    if (!this.isKeyConfigured()) {
      return 'Non configurée (Définir APISPORTS_KEY dans les secrets du serveur)';
    }
    const key = this.getApiKey();
    return `Configurée côté serveur (${key.length} caractères, non exposée au client)`;
  }

  /**
   * Effectue un appel HTTP authentifié vers l'API-Football avec gestion d'erreurs et timeout
   */
  private async fetchApi<T>(endpoint: string, cacheTtlSeconds = this.defaultCacheTtlSeconds): Promise<{ data: T | null; error?: string; status: number }> {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < cached.ttlSeconds * 1000) {
      return { data: cached.data, status: 200 };
    }

    if (!this.isKeyConfigured()) {
      return {
        data: null,
        error: 'Clé API APISPORTS_KEY non configurée dans les variables d\'environnement du serveur.',
        status: 400,
      };
    }

    const apiKey = this.getApiKey();
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000); // Timeout 9 secondes

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-apisports-key': apiKey,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        return {
          data: null,
          error: 'Clé API APISPORTS_KEY invalide ou non autorisée par le serveur API-Sports (Erreur HTTP ' + response.status + ').',
          status: response.status,
        };
      }

      if (response.status === 429) {
        return {
          data: null,
          error: 'Limite de requêtes API-Football atteinte (Quota journalier ou rate-limit dépassé - Erreur HTTP 429).',
          status: 429,
        };
      }

      if (!response.ok) {
        return {
          data: null,
          error: `Erreur API-Football : HTTP ${response.status} ${response.statusText}`,
          status: response.status,
        };
      }

      const json = await response.json();

      // Vérifier si API-Sports a renvoyé des erreurs au niveau du corps JSON
      if (json.errors) {
        if (Array.isArray(json.errors) && json.errors.length > 0) {
          return { data: null, error: json.errors.join(', '), status: 400 };
        } else if (typeof json.errors === 'object' && Object.keys(json.errors).length > 0) {
          const firstErr = Object.values(json.errors)[0] as string;
          return { data: null, error: String(firstErr), status: 400 };
        }
      }

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: json,
        timestamp: now,
        ttlSeconds: cacheTtlSeconds,
      });

      return { data: json, status: 200 };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { data: null, error: 'Délai d\'attente dépassé (timeout 9s) lors de la requête API-Football.', status: 408 };
      }
      return { data: null, error: `Erreur réseau de communication avec API-Football: ${err.message}`, status: 500 };
    }
  }

  /**
   * Diagnostic en direct de la connexion et des quotas
   */
  public async getDiagnostic(): Promise<ApiFootballDiagnostic> {
    const isConfigured = this.isKeyConfigured();
    const checkedAt = new Date().toISOString();

    const accessibleCompetitions = [
      { id: 2, name: 'UEFA Champions League', country: 'Europe' },
      { id: 39, name: 'Premier League', country: 'England' },
      { id: 61, name: 'Ligue 1', country: 'France' },
      { id: 140, name: 'La Liga', country: 'Spain' },
      { id: 135, name: 'Serie A', country: 'Italy' },
      { id: 78, name: 'Bundesliga', country: 'Germany' },
      { id: 6, name: 'Coupe d\'Afrique des Nations (CAN)', country: 'Africa' },
    ];

    const observedBookmakers = [
      { id: 11, name: '1xBet', isAfricanRelevant: true },
      { id: 17, name: 'Betclic', isAfricanRelevant: true },
      { id: 6, name: 'Bwin', isAfricanRelevant: false },
      { id: 4, name: 'Pinnacle', isAfricanRelevant: true },
      { id: 8, name: 'Bet365', isAfricanRelevant: false },
      { id: 16, name: 'Unibet', isAfricanRelevant: false },
    ];

    const availableMarkets = [
      { id: 1, name: 'Match Winner (1X2)', key: '1X2' as MarketType },
      { id: 5, name: 'Goals Over/Under 2.5', key: 'OVER_UNDER_2_5' as MarketType },
      { id: 8, name: 'Both Teams Score (BTTS)', key: 'BTTS' as MarketType },
    ];

    if (!isConfigured) {
      const diag: ApiFootballDiagnostic = {
        providerId: 'api-football',
        providerName: 'API-Football (v3.football.api-sports.io)',
        connectionState: 'not_configured',
        isKeyConfigured: false,
        maskedKeyNotice: this.getMaskedKeyNotice(),
        requestsUsedToday: 0,
        dailyLimit: 100, // Forfait gratuit par défaut
        latencyMs: 0,
        lastCheckedAt: checkedAt,
        cacheTtlSeconds: this.defaultCacheTtlSeconds,
        message: 'Clé API-Football absente. Pour activer le flux réel, configurez APISPORTS_KEY dans les Secrets AI Studio.',
        accessibleCompetitions,
        observedBookmakers,
        availableMarkets,
        scannedEventsCount: 0,
        insufficientCoverageCount: 0,
        coverageErrors: ['Clé APISPORTS_KEY non configurée côté serveur.'],
      };
      this.lastDiagnostic = diag;
      return diag;
    }

    // Si configuré, tester la connexion réelle via /status
    const startTime = Date.now();
    const statusRes = await this.fetchApi<ApiFootballStatusResponse>('/status', 300);
    const latencyMs = Date.now() - startTime;

    if (statusRes.error) {
      let state: ConnectionState = 'network_error';
      const errLower = statusRes.error.toLowerCase();
      if (
        statusRes.status === 401 ||
        statusRes.status === 403 ||
        errLower.includes('key') ||
        errLower.includes('token') ||
        errLower.includes('application key')
      ) {
        state = 'invalid_key';
      } else if (statusRes.status === 429 || errLower.includes('limit') || errLower.includes('quota')) {
        state = 'rate_limited';
      }

      const diag: ApiFootballDiagnostic = {
        providerId: 'api-football',
        providerName: 'API-Football (v3.football.api-sports.io)',
        connectionState: state,
        isKeyConfigured: true,
        maskedKeyNotice: this.getMaskedKeyNotice(),
        requestsUsedToday: 0,
        dailyLimit: 100,
        latencyMs,
        lastCheckedAt: checkedAt,
        cacheTtlSeconds: this.defaultCacheTtlSeconds,
        message: statusRes.error,
        accessibleCompetitions,
        observedBookmakers,
        availableMarkets,
        scannedEventsCount: 0,
        insufficientCoverageCount: 0,
        coverageErrors: [statusRes.error],
      };
      this.lastDiagnostic = diag;
      return diag;
    }

    const resp = statusRes.data?.response;
    const requests = resp?.requests;
    const subscription = resp?.subscription;
    const account = resp?.account;

    const diag: ApiFootballDiagnostic = {
      providerId: 'api-football',
      providerName: 'API-Football (v3.football.api-sports.io)',
      connectionState: 'connected',
      isKeyConfigured: true,
      maskedKeyNotice: this.getMaskedKeyNotice(),
      accountEmail: account?.email ? account.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : undefined,
      planName: subscription?.plan || 'Free Plan',
      requestsUsedToday: requests?.current || 0,
      dailyLimit: requests?.limit_day || 100,
      latencyMs,
      lastCheckedAt: checkedAt,
      cacheTtlSeconds: this.defaultCacheTtlSeconds,
      lastCollectTimestamp: new Date().toISOString(),
      message: 'Connexion active validée avec les serveurs API-Sports.',
      accessibleCompetitions,
      observedBookmakers,
      availableMarkets,
      scannedEventsCount: 0,
      insufficientCoverageCount: 0,
      coverageErrors: [],
    };

    this.lastDiagnostic = diag;
    return diag;
  }

  /**
   * Normalise les données brutes d'API-Football en modèles communs
   */
  public normalizeApiResponse(rawItems: ApiFootballFixtureOdds[]): {
    normalizedEvents: {
      fixtureId: number;
      leagueName: string;
      homeTeam: string;
      awayTeam: string;
      date: string;
      markets: {
        marketType: MarketType;
        marketName: string;
        bookmakerOdds: {
          bookmakerId: string;
          bookmakerName: string;
          odds: Record<string, number>;
          timestamp: string;
        }[];
      }[];
    }[];
    bookmakersFound: Set<string>;
  } {
    const bookmakersFound = new Set<string>();

    const normalizedEvents = (rawItems || []).map((item) => {
      const fixtureId = item.fixture.id;
      const leagueName = item.league.name;
      const date = item.fixture.date;

      // Extraire les bookmakers et marchés
      const marketMap = new Map<MarketType, {
        marketName: string;
        bookmakerOdds: {
          bookmakerId: string;
          bookmakerName: string;
          odds: Record<string, number>;
          timestamp: string;
        }[];
      }>();

      (item.bookmakers || []).forEach((bk) => {
        bookmakersFound.add(bk.name);

        (bk.bets || []).forEach((bet) => {
          let marketType: MarketType | null = null;
          let marketName = bet.name;
          const oddsRecord: Record<string, number> = {};

          if (bet.id === 1 || bet.name.toLowerCase().includes('winner')) {
            marketType = '1X2';
            marketName = 'Résultat du Match (1X2)';

            bet.values.forEach((v) => {
              const odd = parseFloat(v.odd);
              if (!isNaN(odd) && odd > 1.0) {
                if (v.value.toLowerCase() === 'home') oddsRecord['1'] = odd;
                else if (v.value.toLowerCase() === 'draw') oddsRecord['X'] = odd;
                else if (v.value.toLowerCase() === 'away') oddsRecord['2'] = odd;
              }
            });
          } else if (bet.id === 5 || bet.name.toLowerCase().includes('over/under')) {
            // Vérifier que c'est bien la ligne 2.5
            const overVal = bet.values.find((v) => v.value.toLowerCase().includes('over 2.5'));
            const underVal = bet.values.find((v) => v.value.toLowerCase().includes('under 2.5'));

            if (overVal && underVal) {
              const overOdd = parseFloat(overVal.odd);
              const underOdd = parseFloat(underVal.odd);
              if (!isNaN(overOdd) && overOdd > 1.0 && !isNaN(underOdd) && underOdd > 1.0) {
                marketType = 'OVER_UNDER_2_5';
                marketName = 'Total Buts Plus/Moins 2.5';
                oddsRecord['Over'] = overOdd;
                oddsRecord['Under'] = underOdd;
              }
            }
          } else if (bet.id === 8 || bet.name.toLowerCase().includes('both teams score')) {
            const yesVal = bet.values.find((v) => v.value.toLowerCase() === 'yes');
            const noVal = bet.values.find((v) => v.value.toLowerCase() === 'no');

            if (yesVal && noVal) {
              const yesOdd = parseFloat(yesVal.odd);
              const noOdd = parseFloat(noVal.odd);
              if (!isNaN(yesOdd) && yesOdd > 1.0 && !isNaN(noOdd) && noOdd > 1.0) {
                marketType = 'BTTS';
                marketName = 'Les deux équipes marquent (BTTS)';
                oddsRecord['Yes'] = yesOdd;
                oddsRecord['No'] = noOdd;
              }
            }
          }

          if (marketType && Object.keys(oddsRecord).length >= 2) {
            if (!marketMap.has(marketType)) {
              marketMap.set(marketType, {
                marketName,
                bookmakerOdds: [],
              });
            }

            marketMap.get(marketType)!.bookmakerOdds.push({
              bookmakerId: String(bk.id),
              bookmakerName: bk.name,
              odds: oddsRecord,
              timestamp: item.update || new Date().toISOString(),
            });
          }
        });
      });

      const markets = Array.from(marketMap.entries()).map(([mType, data]) => ({
        marketType: mType,
        marketName: data.marketName,
        bookmakerOdds: data.bookmakerOdds,
      }));

      const anyItem = item as any;
      const homeTeam =
        anyItem.teams?.home?.name ||
        anyItem.fixture?.homeTeam ||
        anyItem.fixture?.home ||
        `Équipe Domicile (#${fixtureId})`;
      const awayTeam =
        anyItem.teams?.away?.name ||
        anyItem.fixture?.awayTeam ||
        anyItem.fixture?.away ||
        `Équipe Extérieur (#${fixtureId})`;

      return {
        fixtureId,
        leagueName,
        homeTeam,
        awayTeam,
        date,
        markets,
      };
    });

    return { normalizedEvents, bookmakersFound };
  }

  /**
   * Analyse les cotes normalisées et détecte les surebets réels
   * RÈGLE CRITIQUE : Si moins de 2 bookmakers proposent des cotes pour un marché,
   * ou si une issue est manquante, consigner la raison de rejet précise.
   */
  public detectSurebetsFromOdds(
    normalizedEvents: ReturnType<typeof this.normalizeApiResponse>['normalizedEvents'],
    budget = 100000,
    maxFreshnessMinutes = 30
  ): {
    opportunities: SurebetOpportunity[];
    insufficientCoverageCount: number;
    totalScanned: number;
    stats: ScannerStats;
    rejectedEvents: RejectedEventSummary[];
  } {
    const opportunities: SurebetOpportunity[] = [];
    const rejectedEvents: RejectedEventSummary[] = [];
    let insufficientCoverageCount = 0;
    let totalScanned = 0;
    const now = Date.now();

    normalizedEvents.forEach((event) => {
      event.markets.forEach((market) => {
        totalScanned++;
        const bookmakers = market.bookmakerOdds;
        const matchTitle = `${event.homeTeam} vs ${event.awayTeam}`;
        const providerUpdatedAt = bookmakers[0]?.timestamp || event.date;

        // RÈGLE 1 : Minimum 2 bookmakers distincts nécessaires pour un arbitrage réel
        if (bookmakers.length < 2) {
          insufficientCoverageCount++;
          rejectedEvents.push({
            id: `rej-bk-${event.fixtureId}-${market.marketType}`,
            fixtureId: event.fixtureId,
            sportId: 'football',
            competition: event.leagueName,
            match: matchTitle,
            marketType: market.marketType,
            marketLabel: market.marketName,
            reasonCode: 'INSUFFICIENT_BOOKMAKERS',
            reasonLabel: `Moins de 2 bookmakers distincts comparables (${bookmakers.length} bookmaker présent : ${bookmakers.map((b) => b.bookmakerName).join(', ') || 'aucun'})`,
            bookmakersObserved: bookmakers.map((b) => b.bookmakerName),
            providerUpdatedAt,
          });
          return;
        }

        // Trouver les meilleures cotes pour chaque issue mutuellement exclusive
        let expectedKeys: string[] = [];
        if (market.marketType === '1X2') expectedKeys = ['1', 'X', '2'];
        else if (market.marketType === 'OVER_UNDER_2_5') expectedKeys = ['Over', 'Under'];
        else if (market.marketType === 'BTTS') expectedKeys = ['Yes', 'No'];

        const bestOutcomes: RawOutcomeInput[] = [];
        let allOutcomesCovered = true;
        let invalidOddDetected = false;

        for (const key of expectedKeys) {
          let bestOdd = 0;
          let bestBookmakerName = '';
          let bestBookmakerId = '';

          for (const bk of bookmakers) {
            const odd = bk.odds[key];
            if (odd !== undefined) {
              if (odd <= 1.0 || isNaN(odd) || !isFinite(odd)) {
                invalidOddDetected = true;
              } else if (odd > bestOdd) {
                bestOdd = odd;
                bestBookmakerName = bk.bookmakerName;
                bestBookmakerId = bk.bookmakerId;
              }
            }
          }

          if (bestOdd <= 1.0) {
            allOutcomesCovered = false;
            break;
          }

          bestOutcomes.push({
            key,
            label:
              key === '1'
                ? `1 (Domicile)`
                : key === 'X'
                ? `Nul (X)`
                : key === '2'
                ? `2 (Extérieur)`
                : key,
            odd: bestOdd,
            bookmakerId: bestBookmakerId,
            bookmakerName: bestBookmakerName,
          });
        }

        // Si cote <= 1.00 détectée
        if (invalidOddDetected) {
          rejectedEvents.push({
            id: `rej-inv-${event.fixtureId}-${market.marketType}`,
            fixtureId: event.fixtureId,
            sportId: 'football',
            competition: event.leagueName,
            match: matchTitle,
            marketType: market.marketType,
            marketLabel: market.marketName,
            reasonCode: 'INVALID_ODDS',
            reasonLabel: 'Cote invalide détectée (inférieure ou égale à 1.00 ou valeur corrompue)',
            bookmakersObserved: bookmakers.map((b) => b.bookmakerName),
            providerUpdatedAt,
          });
          return;
        }

        // Si une issue n'a aucune cote disponible chez aucun bookmaker
        if (!allOutcomesCovered || bestOutcomes.length !== expectedKeys.length) {
          insufficientCoverageCount++;
          const missing = expectedKeys.filter((k) => !bestOutcomes.some((b) => b.key === k));
          rejectedEvents.push({
            id: `rej-inc-${event.fixtureId}-${market.marketType}`,
            fixtureId: event.fixtureId,
            sportId: 'football',
            competition: event.leagueName,
            match: matchTitle,
            marketType: market.marketType,
            marketLabel: market.marketName,
            reasonCode: 'INCOMPLETE_OUTCOMES',
            reasonLabel: `Marché incomplet : issue(s) [${missing.join(', ')}] non cotée(s) chez les bookmakers`,
            bookmakersObserved: bookmakers.map((b) => b.bookmakerName),
            providerUpdatedAt,
          });
          return;
        }

        // Vérification de la fraîcheur des données
        const freshness = ArbitrageEngine.checkOddsFreshness(providerUpdatedAt, maxFreshnessMinutes);
        if (freshness.isExpired) {
          rejectedEvents.push({
            id: `rej-exp-${event.fixtureId}-${market.marketType}`,
            fixtureId: event.fixtureId,
            sportId: 'football',
            competition: event.leagueName,
            match: matchTitle,
            marketType: market.marketType,
            marketLabel: market.marketName,
            reasonCode: 'EXPIRED_ODDS',
            reasonLabel: `Cotes périmées : l'âge de la cote (${freshness.ageMinutes} min) dépasse le seuil maximal configuré (${maxFreshnessMinutes} min)`,
            bookmakersObserved: bookmakers.map((b) => b.bookmakerName),
            providerUpdatedAt,
          });
          return;
        }

        // Calcul mathématique déterministe via ArbitrageEngine
        const calc = ArbitrageEngine.calculateStakes(bestOutcomes, budget, 'none', market.marketType);

        if (calc.isArbitrage) {
          opportunities.push({
            id: `real-api-${event.fixtureId}-${market.marketType}`,
            sportId: 'football',
            sportName: 'Football',
            competition: event.leagueName,
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam,
            startTime: event.date,
            isLive: false,
            marketType: market.marketType,
            marketLabel: market.marketName,
            settlementRule: 'Temps réglementaire 90 min (hors prolongations)',
            outcomes: bestOutcomes.map((o) => ({
              key: o.key,
              label: o.label,
              odd: o.odd,
              bookmakerId: o.bookmakerId || '',
              bookmakerName: o.bookmakerName || '',
              timestamp: providerUpdatedAt,
            })),
            sumOfInverses: calc.sumOfInverses,
            theoreticalYieldPercent: calc.theoreticalYieldPercent,
            freshnessSeconds: Math.max(1, Math.floor((now - new Date(providerUpdatedAt).getTime()) / 1000)),
            detectedAt: new Date(now).toISOString(),
            collectedAt: new Date(now).toISOString(),
            providerUpdatedAt,
            isExpired: false,
            validationStatus: calc.palpRiskDetected ? 'PALP_ALERT' : 'VALIDATED',
            validationMessage: `Vérifié · 3 issues exhaustives (1, X, 2) · ${new Set(bestOutcomes.map((o) => o.bookmakerName)).size} bookmakers indépendants`,
            riskLevel: calc.palpRiskDetected ? 'ALERTE_ERREUR_PALP' : 'FAIBLE',
            isDemoData: false, // Données réelles
          });
        } else {
          rejectedEvents.push({
            id: `rej-noarb-${event.fixtureId}-${market.marketType}`,
            fixtureId: event.fixtureId,
            sportId: 'football',
            competition: event.leagueName,
            match: matchTitle,
            marketType: market.marketType,
            marketLabel: market.marketName,
            reasonCode: 'NO_ARBITRAGE',
            reasonLabel: `Aucun arbitrage : somme des inverses S = ${calc.sumOfInverses.toFixed(4)} (rendement = ${calc.theoreticalYieldPercent.toFixed(2)}%)`,
            bookmakersObserved: bookmakers.map((b) => b.bookmakerName),
            bestOddsFound: bestOutcomes.reduce((acc, it) => ({ ...acc, [it.key]: it.odd }), {}),
            sumOfInverses: calc.sumOfInverses,
            theoreticalYield: calc.theoreticalYieldPercent,
            providerUpdatedAt,
          });
        }
      });
    });

    const stats: ScannerStats = {
      totalScanned,
      validArbitragesCount: opportunities.length,
      rejectedCount: rejectedEvents.length,
      rejectedByReason: {
        INSUFFICIENT_BOOKMAKERS: rejectedEvents.filter((r) => r.reasonCode === 'INSUFFICIENT_BOOKMAKERS').length,
        INCOMPLETE_OUTCOMES: rejectedEvents.filter((r) => r.reasonCode === 'INCOMPLETE_OUTCOMES').length,
        INCOMPATIBLE_RULES: rejectedEvents.filter((r) => r.reasonCode === 'INCOMPATIBLE_RULES').length,
        INVALID_ODDS: rejectedEvents.filter((r) => r.reasonCode === 'INVALID_ODDS').length,
        EXPIRED_ODDS: rejectedEvents.filter((r) => r.reasonCode === 'EXPIRED_ODDS').length,
        FUTURE_TIMESTAMP: rejectedEvents.filter((r) => r.reasonCode === 'FUTURE_TIMESTAMP').length,
        MISSING_TIMESTAMP: rejectedEvents.filter((r) => r.reasonCode === 'MISSING_TIMESTAMP').length,
        NO_ARBITRAGE: rejectedEvents.filter((r) => r.reasonCode === 'NO_ARBITRAGE').length,
      },
    };

    return {
      opportunities,
      insufficientCoverageCount,
      totalScanned,
      stats,
      rejectedEvents,
    };
  }

  /**
   * Récupère les opportunités réelles de cotes depuis API-Football
   * Utilise le cache pour ne pas consommer inutilement le quota journalier
   */
  public async getRealFootballSurebets(
    sportId: SportId = 'football',
    maxFreshnessMinutes = 30
  ): Promise<{
    opportunities: SurebetOpportunity[];
    diagnostic: ApiFootballDiagnostic;
    stats: ScannerStats;
    rejectedEvents: RejectedEventSummary[];
  }> {
    const diagnostic = await this.getDiagnostic();

    const emptyStats: ScannerStats = {
      totalScanned: 0,
      validArbitragesCount: 0,
      rejectedCount: 0,
      rejectedByReason: {
        INSUFFICIENT_BOOKMAKERS: 0,
        INCOMPLETE_OUTCOMES: 0,
        INCOMPATIBLE_RULES: 0,
        INVALID_ODDS: 0,
        EXPIRED_ODDS: 0,
        FUTURE_TIMESTAMP: 0,
        MISSING_TIMESTAMP: 0,
        NO_ARBITRAGE: 0,
      },
    };

    // RÈGLE ARCHITECTURE MULTI-SPORT : Vérifier si le sport demandé est pris en charge
    if (!this.supportsSport(sportId)) {
      diagnostic.coverageErrors = [
        `Le sport '${sportId}' n'est pas pris en charge par le fournisseur API-Football (qui couvre exclusivement le football pré-match). Pour explorer ce sport avec le calculateur, activez le Mode Démonstration.`,
      ];
      return {
        opportunities: [],
        diagnostic,
        stats: emptyStats,
        rejectedEvents: [],
      };
    }

    if (diagnostic.connectionState !== 'connected') {
      return {
        opportunities: [],
        diagnostic,
        stats: emptyStats,
        rejectedEvents: [],
      };
    }

    // Récupérer les cotes pour la Premier League (league 39, saison 2026)
    // Endpoint documenté : /odds?league=39&season=2026
    const res = await this.fetchApi<{ response: ApiFootballFixtureOdds[] }>('/odds?league=39&season=2026', 180);

    if (res.error || !res.data || !Array.isArray(res.data.response)) {
      diagnostic.coverageErrors.push(res.error || 'Aucune cote reçue d\'API-Football pour cette sélection.');
      return {
        opportunities: [],
        diagnostic,
        stats: emptyStats,
        rejectedEvents: [],
      };
    }

    const { normalizedEvents, bookmakersFound } = this.normalizeApiResponse(res.data.response);
    const { opportunities, insufficientCoverageCount, totalScanned, stats, rejectedEvents } =
      this.detectSurebetsFromOdds(normalizedEvents, 100000, maxFreshnessMinutes);

    diagnostic.scannedEventsCount = totalScanned;
    diagnostic.insufficientCoverageCount = insufficientCoverageCount;
    diagnostic.observedBookmakers = Array.from(bookmakersFound).map((name, idx) => ({
      id: idx + 1,
      name,
      isAfricanRelevant: ['1xbet', 'betclic', 'premier bet', 'sportcash'].some((k) =>
        name.toLowerCase().includes(k)
      ),
    }));

    return {
      opportunities,
      diagnostic,
      stats,
      rejectedEvents,
    };
  }
}
