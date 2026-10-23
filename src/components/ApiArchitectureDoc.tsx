import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Layers,
  Key,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Activity,
  Code2,
  Cpu,
} from 'lucide-react';
import { ProviderStatus } from '../types/surebet';

export const ApiArchitectureDoc: React.FC = () => {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [archInfo, setArchInfo] = useState<any>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'adapter' | 'schema' | 'env'>('adapter');

  useEffect(() => {
    fetch('/api/providers')
      .then((res) => res.json())
      .then((data) => {
        if (data.providers) setProviders(data.providers);
        if (data.architectureInfo) setArchInfo(data.architectureInfo);
      })
      .catch((err) => console.error(err));
  }, []);

  const adapterCode = `// src/server/providers/oddsProvider.ts
export interface IOddsProvider {
  id: string;
  name: string;
  getStatus(): ProviderStatus;
  getSurebets(sportId?: SportId, liveOnly?: boolean): Promise<SurebetOpportunity[]>;
  getMatchOdds(eventId: string): Promise<OddsSnapshot | null>;
  getAllMatchesOdds(sportId?: SportId): Promise<OddsSnapshot[]>;
}

// Exemple d'implémentation pour The Odds API
export class TheOddsApiAdapter implements IOddsProvider {
  private apiKey = process.env.THE_ODDS_API_KEY; // Clé stockée exclusivement côté serveur
  
  public async getSurebets(sportId?: SportId): Promise<SurebetOpportunity[]> {
    const rawEvents = await fetch(\`https://api.the-odds-api.com/v4/sports/\${sportId}/odds?apiKey=\${this.apiKey}&regions=eu,uk\`);
    // 1. Normalisation des cotes
    // 2. Calcul déterministe via ArbitrageEngine.calculateSumOfInverses()
    // 3. Filtrage des erreurs manifestes (Palpable Error)
    return normalizedSurebets;
  }
}`;

  const postgresSchema = `-- Schéma PostgreSQL Normalisé (Phase 2 Production)
CREATE TABLE sports (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  icon VARCHAR(8)
);

CREATE TABLE bookmakers (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  is_verified_ci BOOLEAN DEFAULT FALSE,
  official_domain VARCHAR(255),
  reliability_score INT DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE events (
  id VARCHAR(64) PRIMARY KEY,
  sport_id VARCHAR(32) REFERENCES sports(id),
  competition VARCHAR(128) NOT NULL,
  home_team VARCHAR(128) NOT NULL,
  away_team VARCHAR(128) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_live BOOLEAN DEFAULT FALSE
);

CREATE TABLE odds_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(64) REFERENCES events(id) ON DELETE CASCADE,
  bookmaker_id VARCHAR(32) REFERENCES bookmakers(id),
  market_type VARCHAR(32) NOT NULL,
  outcome_key VARCHAR(16) NOT NULL,
  odd_value NUMERIC(6, 3) NOT NULL,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE surebets_detected (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(64) REFERENCES events(id),
  market_type VARCHAR(32) NOT NULL,
  sum_of_inverses NUMERIC(7, 5) NOT NULL,
  theoretical_yield NUMERIC(5, 2) NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);`;

  const envGuide = `# .env (Secrets Serveur — Jamais exposés au Client Vite)
PORT=3000
NODE_ENV=production

# Fournisseur International (The Odds API)
# Obtenez une clé officielle sur https://the-odds-api.com
THE_ODDS_API_KEY="votre_cle_api_secrete"

# Base de Données PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/surebet_africa"

# Cache & Rate Limiting
REDIS_URL="redis://localhost:6379"
ODDS_CACHE_TTL_SECONDS=30`;

  return (
    <div className="space-y-6">
      {/* Kicker et Titre */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Architecture Logicielle & Connecteurs</span>
            <span aria-hidden="true">·</span>
            <span>Adapter Pattern</span>
            <span aria-hidden="true">·</span>
            <span>PostgreSQL & Node.js</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white font-display">
            Architecture Système & Fournisseurs d'API
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="h-4 w-4" />
          <span>Clés API 100% isolées côté serveur</span>
        </div>
      </div>

      {/* État des Fournisseurs d'API en temps réel */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white">
          État des Connecteurs de Cotes (Phase 1 & Phase 2)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-semibold text-white text-sm">{p.name}</h3>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    p.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {p.status === 'active' ? 'ACTIF (DÉMO)' : 'EN ATTENTE DE CLÉ'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[11px] font-mono">
                <div>
                  <div className="text-slate-500">Latence</div>
                  <div className="text-white font-bold">{p.latencyMs} ms</div>
                </div>
                <div>
                  <div className="text-slate-500">Requêtes / Jour</div>
                  <div className="text-white font-bold">
                    {p.requestsUsedToday} / {p.dailyQuota}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Type</div>
                  <div className="text-white">{p.type}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sélecteur de code & spécification technique */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-white">Spécifications & Code de Référence</span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveCodeTab('adapter')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeCodeTab === 'adapter'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Interface Adapter (TS)
            </button>
            <button
              onClick={() => setActiveCodeTab('schema')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeCodeTab === 'schema'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Schéma PostgreSQL (DDL)
            </button>
            <button
              onClick={() => setActiveCodeTab('env')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeCodeTab === 'env'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Configuration .env
            </button>
          </div>
        </div>

        {/* Bloc de code syntaxique */}
        <div className="rounded-lg bg-slate-950 border border-slate-800 p-4 overflow-x-auto">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {activeCodeTab === 'adapter' && adapterCode}
            {activeCodeTab === 'schema' && postgresSchema}
            {activeCodeTab === 'env' && envGuide}
          </pre>
        </div>

        {/* Règles de sécurité */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Engagements de Sécurité & Non-Simulation Trompeuse</span>
          </h4>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
            <li>
              <strong>Aucune fausse connexion :</strong> Tant que l'utilisateur n'a pas renseigné une clé API valide dans les secrets serveur, l'application reste clairement identifiée en mode démo déterministe.
            </li>
            <li>
              <strong>Isolation étanche des secrets :</strong> Aucune clé d'API sportive ne transite jamais vers le client React frontend. Les requêtes sont entièrement proxifiées côté Node.js.
            </li>
            <li>
              <strong>Cache mémoire & Quotas :</strong> Mise en cache d'une durée de 10 secondes en direct et 60 secondes en pré-match pour économiser les quotas de requêtes externes.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
