import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ArbitrageEngine } from './src/engine/arbitrageEngine';
import { OddsProviderManager } from './src/server/providers/oddsProvider';
import { BOOKMAKERS_REGISTRY, SPORTS_REGISTRY } from './src/data/bookmakers';
import { SportId, RoundingMode } from './src/types/surebet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware CORS pour supporter les requêtes de l'iframe de prévisualisation et des proxys
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// In-memory alert subscriptions & favorites log for demonstration
const userAlerts: Array<{
  id: string;
  minYield: number;
  sportId: string;
  channel: 'in_app' | 'sms' | 'whatsapp';
  phone?: string;
  createdAt: string;
}> = [
  {
    id: 'alert-default-1',
    minYield: 2.0,
    sportId: 'all',
    channel: 'in_app',
    createdAt: new Date().toISOString(),
  },
];

const providerManager = OddsProviderManager.getInstance();

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'DEMONSTRATION_DETERMINISTE',
    service: 'SUREBET AFRICA AI Engine',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// 2. Sports registry
app.get('/api/sports', (req, res) => {
  res.json(SPORTS_REGISTRY);
});

// 3. Bookmakers registry
app.get('/api/bookmakers', (req, res) => {
  res.json(BOOKMAKERS_REGISTRY);
});

// 4. Providers status and architecture
app.get('/api/providers', (req, res) => {
  const statuses = providerManager.getProvidersStatus();
  res.json({
    activeProviderId: providerManager.getActiveProvider().id,
    providers: statuses,
    architectureInfo: {
      pattern: 'Adapter Pattern (IOddsProvider)',
      cacheTTLSeconds: 180,
      serverSideOnly: true,
      apiKeyStorage: 'Environment Secrets (APISPORTS_KEY, THE_ODDS_API_KEY)',
      quotaMonitoring: 'Enabled with daily rate limiter',
    },
  });
});

// 4b. API-Football Diagnostic & Coverage Endpoint (Phase 3)
app.get('/api/providers/api-football/diagnostic', async (req, res) => {
  try {
    const diagnostic = await providerManager.getApiFootball().getDiagnostic();
    // Sécurité absolue : garantir qu'aucune clé secrète n'apparaît dans la réponse
    res.json(diagnostic);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors du diagnostic API-Football: ' + error.message });
  }
});

// 4c. Test de connexion en direct API-Football
app.post('/api/providers/api-football/test-connection', async (req, res) => {
  try {
    const diagnostic = await providerManager.getApiFootball().getDiagnostic();
    res.json(diagnostic);
  } catch (error: any) {
    res.status(500).json({ error: 'Échec du test de connexion: ' + error.message });
  }
});

// 4d. Collecte de cotes réelles Football (Phase 3)
app.get('/api/arbitrage/real-football', async (req, res) => {
  try {
    const result = await providerManager.getApiFootball().getRealFootballSurebets();
    res.json({
      success: true,
      provider: 'API-Football (v3.football.api-sports.io)',
      diagnostic: result.diagnostic,
      opportunities: result.opportunities,
      count: result.opportunities.length,
      notice: result.diagnostic.connectionState === 'connected'
        ? 'Cotes réelles collectées depuis API-Football'
        : 'Mode démonstration actif : clé APISPORTS_KEY non connectée',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la collecte réelle: ' + error.message });
  }
});

// 4e. The Odds API V4 Endpoints (Lot 3)
app.get('/api/providers/the-odds-api/diagnostic', async (_req, res) => {
  try {
    const diagnostic = await providerManager.getTheOddsApi().getDiagnostic();
    res.json(diagnostic);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur diagnostic The Odds API: ' + error.message });
  }
});

app.post('/api/providers/the-odds-api/test-connection', async (_req, res) => {
  try {
    const diagnostic = await providerManager.getTheOddsApi().testConnection();
    res.json(diagnostic);
  } catch (error: any) {
    res.status(500).json({ error: 'Échec test connexion The Odds API: ' + error.message });
  }
});

app.get('/api/providers/the-odds-api/sports', async (_req, res) => {
  try {
    const sports = await providerManager.getTheOddsApi().getSportsCatalog();
    const diagnostic = await providerManager.getTheOddsApi().getDiagnostic();
    res.json({
      success: true,
      isDemoData: false,
      count: sports.length,
      sports,
      diagnostic,
    });
  } catch (error: any) {
    res.status(502).json({
      success: false,
      error: 'Impossible de récupérer le catalogue The Odds API: ' + error.message,
    });
  }
});

app.get('/api/providers/the-odds-api/matches', async (req, res) => {
  try {
    const sport = typeof req.query.sport === 'string' && req.query.sport !== 'all' ? (req.query.sport as SportId) : undefined;
    const matches = await providerManager.getTheOddsApi().getAllMatchesOdds(sport);
    const diagnostic = await providerManager.getTheOddsApi().getDiagnostic();
    res.json({
      success: true,
      source: 'the_odds_api',
      isDemoData: false,
      count: matches.length,
      matches,
      diagnostic,
    });
  } catch (error: any) {
    res.status(502).json({
      success: false,
      error: 'Échec de récupération des cotes The Odds API: ' + error.message,
    });
  }
});

// 5. Arbitrage opportunities scan (hybride : démo, API-Football réel ou The Odds API V4)
app.get('/api/arbitrage/opportunities', async (req, res) => {
  try {
    const {
      sport,
      competition,
      minYield,
      maxYield,
      live,
      bookmaker,
      market,
      maxFreshnessMinutes,
      search,
      source,
    } = req.query;

    let opportunities: any[] = [];
    let activeMode = 'DEMONSTRATION_IDENTIFIEE';
    let dataNotice = 'Données de démonstration déterministes. Cotes simulées à vocation d\'apprentissage.';
    let diagnosticInfo: any = null;
    let stats: any = null;
    let rejectedEvents: any[] = [];

    const freshnessThreshold = maxFreshnessMinutes ? parseFloat(maxFreshnessMinutes as string) : 30;
    const sportParam = sport && sport !== 'all' ? (sport as SportId) : undefined;

    if (source === 'the_odds_api') {
      const theOddsApi = providerManager.getTheOddsApi();
      const liveFilter = live === 'true' ? true : live === 'false' ? false : undefined;
      opportunities = await theOddsApi.getSurebets(sportParam, liveFilter, freshnessThreshold);
      const audit = await theOddsApi.getScannerAudit(sportParam);
      stats = audit.stats;
      rejectedEvents = audit.rejectedEvents;
      diagnosticInfo = await theOddsApi.getDiagnostic();

      activeMode =
        diagnosticInfo.connectionState === 'connected'
          ? 'DONNEES_REELLES_THE_ODDS_API'
          : 'THE_ODDS_API_NON_CONNECTEE';
      dataNotice =
        diagnosticInfo.connectionState === 'connected'
          ? 'Cotes réelles collectées depuis The Odds API V4 (Agrégateur International multi-sports).'
          : 'The Odds API : clé THE_ODDS_API_KEY non connectée côté serveur.';
    } else if (source === 'real_api_football') {
      const realResult = await providerManager
        .getApiFootball()
        .getRealFootballSurebets(sportParam || 'football', freshnessThreshold);

      opportunities = realResult.opportunities;
      diagnosticInfo = realResult.diagnostic;
      stats = realResult.stats;
      rejectedEvents = realResult.rejectedEvents;

      activeMode =
        realResult.diagnostic.connectionState === 'connected'
          ? 'DONNEES_REELLES_API_FOOTBALL'
          : 'MODE_DEMO_ATTENTE_CLE';
      dataNotice =
        realResult.diagnostic.connectionState === 'connected'
          ? 'Cotes réelles collectées depuis API-Football (v3.football.api-sports.io).'
          : 'Mode démonstration actif : clé APISPORTS_KEY non connectée côté serveur.';
    } else {
      const provider = providerManager.getActiveProvider();
      const liveFilter = live === 'true' ? true : live === 'false' ? false : undefined;
      opportunities = await provider.getSurebets(sportParam, liveFilter, freshnessThreshold);

      if (provider.getScannerAudit) {
        const audit = await provider.getScannerAudit(sportParam);
        stats = audit.stats;
        rejectedEvents = audit.rejectedEvents;
      }
    }

    // Filter by competition
    if (competition && competition !== 'all') {
      opportunities = opportunities.filter((o) =>
        o.competition.toLowerCase().includes((competition as string).toLowerCase())
      );
    }

    // Filter by market type
    if (market && market !== 'all') {
      opportunities = opportunities.filter((o) => o.marketType === market);
    }

    // Filter by minYield
    if (minYield) {
      const min = parseFloat(minYield as string);
      if (!isNaN(min)) {
        opportunities = opportunities.filter((o) => o.theoreticalYieldPercent >= min);
      }
    }

    // Filter by maxYield
    if (maxYield) {
      const max = parseFloat(maxYield as string);
      if (!isNaN(max)) {
        opportunities = opportunities.filter((o) => o.theoreticalYieldPercent <= max);
      }
    }

    // Filter by bookmaker
    if (bookmaker && bookmaker !== 'all') {
      opportunities = opportunities.filter((o) =>
        o.outcomes.some((out: any) => out.bookmakerId === bookmaker)
      );
    }

    // Search by team or competition
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      opportunities = opportunities.filter(
        (o) =>
          o.homeTeam.toLowerCase().includes(q) ||
          o.awayTeam.toLowerCase().includes(q) ||
          o.competition.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      count: opportunities.length,
      mode: activeMode,
      source: source === 'the_odds_api' ? 'the_odds_api' : source === 'real_api_football' ? 'real_api_football' : 'demo',
      dataNotice,
      diagnostic: diagnosticInfo,
      stats,
      rejectedEvents,
      opportunities,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Erreur lors du calcul des surebets: ' + error.message });
  }
});

// 6. Multi-bookmaker match odds comparison
app.get('/api/matches', async (req, res) => {
  try {
    const { sport } = req.query;
    const provider = providerManager.getActiveProvider();
    const sportFilter = sport && sport !== 'all' ? (sport as SportId) : undefined;
    const matches = await provider.getAllMatchesOdds(sportFilter);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des matchs' });
  }
});

// 7. Interactive FCFA Stake Calculator Endpoint
app.post('/api/calculator', (req, res) => {
  try {
    const { outcomes, totalStake, roundingMode, marketType } = req.body;

    if (!Array.isArray(outcomes) || outcomes.length < 2) {
      return res.status(400).json({
        error: 'Au moins 2 issues avec cotes sont nécessaires pour le calcul d\'arbitrage.',
      });
    }

    const stakeAmount = Number(totalStake) || 100000;
    const mode: RoundingMode = roundingMode || 'none';

    const calculation = ArbitrageEngine.calculateStakes(outcomes, stakeAmount, mode, marketType);
    res.json(calculation);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'exécution du calcul d\'arbitrage' });
  }
});

// 8. Historical demonstration opportunities
app.get('/api/history', async (req, res) => {
  try {
    const provider = providerManager.getActiveProvider();
    const history = await provider.getHistoricalOpportunities();
    res.json({
      success: true,
      mode: 'DEMONSTRATION_IDENTIFIEE',
      dataNotice: 'DÉMONSTRATION — DONNÉES FICTIVES',
      history,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors du chargement de l\'historique' });
  }
});

// 8. Alerts management
app.get('/api/alerts', (req, res) => {
  res.json(userAlerts);
});

app.post('/api/alerts', (req, res) => {
  const { minYield, sportId, channel, phone } = req.body;
  const newAlert = {
    id: 'alert-' + Date.now(),
    minYield: Number(minYield) || 2.0,
    sportId: sportId || 'all',
    channel: channel || 'in_app',
    phone: phone || undefined,
    createdAt: new Date().toISOString(),
  };
  userAlerts.push(newAlert);
  res.status(201).json({ success: true, alert: newAlert });
});

// 9. User profile & subscriptions mock
app.get('/api/user/profile', (req, res) => {
  res.json({
    user: {
      id: 'usr-abidjan-01',
      name: 'Trader Arbitrage CI',
      email: 'rolandyapovictorien@gmail.com',
      preferredTimezone: 'Africa/Abidjan', // UTC+0
      currency: 'XOF (FCFA)',
      tier: 'pro',
      tierName: 'Pro Afrique (Illimité)',
      expiresAt: '2026-12-31T23:59:59Z',
      dailyScansUsed: 14,
      dailyScansLimit: 9999,
      country: 'Côte d\'Ivoire',
    },
    tiers: [
      {
        id: 'free',
        name: 'Découverte (Gratuit)',
        priceFcfaMonthly: 0,
        description: 'Pour s\'initier aux principes mathématiques du surebet.',
        maxYieldVisible: 1.5,
        hasLiveSurebets: false,
        hasSmsWhatsappAlerts: false,
        hasMultiAccountCalculator: false,
        scansDailyLimit: 20,
      },
      {
        id: 'pro',
        name: 'Pro Afrique',
        priceFcfaMonthly: 25000,
        description: 'Accès sans restriction à tous les rendements et scanners live.',
        maxYieldVisible: 100,
        hasLiveSurebets: true,
        hasSmsWhatsappAlerts: false,
        hasMultiAccountCalculator: true,
        scansDailyLimit: 9999,
      },
      {
        id: 'vip',
        name: 'VIP Club Arbitrage',
        priceFcfaMonthly: 65000,
        description: 'Alertes WhatsApp & SMS instantanées, gestion multi-comptes et support dédié.',
        maxYieldVisible: 100,
        hasLiveSurebets: true,
        hasSmsWhatsappAlerts: true,
        hasMultiAccountCalculator: true,
        scansDailyLimit: 99999,
      },
    ],
  });
});

// ----------------------------------------------------
// VITE DEV SERVER INTEGRATION & STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SUREBET AFRICA AI Server démarré sur http://localhost:${PORT}`);
  });
}

startServer();
