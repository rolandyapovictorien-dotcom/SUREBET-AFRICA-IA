import React, { useState } from 'react';
import { X, Check, Globe, Shield, CreditCard, Sparkles } from 'lucide-react';
import { formatFcfa } from '../utils/formatters';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'free' | 'pro' | 'vip';
  onSelectTier: (tier: 'free' | 'pro' | 'vip') => void;
  timezone: string;
  onChangeTimezone: (tz: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  onSelectTier,
  timezone,
  onChangeTimezone,
}) => {
  if (!isOpen) return null;

  const timezones = [
    { id: 'Africa/Abidjan', label: 'Abidjan (UTC+0 · Côte d\'Ivoire)' },
    { id: 'Africa/Dakar', label: 'Dakar (UTC+0 · Sénégal)' },
    { id: 'Africa/Douala', label: 'Douala / Yaoundé (UTC+1 · Cameroun)' },
    { id: 'Africa/Kinshasa', label: 'Kinshasa (UTC+1 · RDC)' },
    { id: 'Africa/Lagos', label: 'Lagos (UTC+1 · Nigéria)' },
    { id: 'Europe/Paris', label: 'Paris (UTC+1/2 · France)' },
  ];

  const tiers = [
    {
      id: 'free' as const,
      name: 'Découverte (Gratuit)',
      price: 0,
      description: 'Pour s\'initier aux principes mathématiques du surebet.',
      features: [
        'Surebets pré-match < 1.5% de rendement',
        'Calculateur FCFA complet',
        '20 scans quotidiens',
        'Support communautaire',
      ],
    },
    {
      id: 'pro' as const,
      name: 'Pro Afrique',
      price: 25000,
      isPopular: true,
      description: 'Accès sans restriction à tous les rendements et scanners live.',
      features: [
        'Tous les rendements sans plafond (1% à 15%+)',
        'Scanners en direct (Live 1X2 & Over/Under)',
        'Scans illimités 24/7',
        'Filtres avancés par bookmakers africains',
      ],
    },
    {
      id: 'vip' as const,
      name: 'VIP Club & Alertes',
      price: 65000,
      description: 'Alertes instantanées WhatsApp et accompagnement.',
      features: [
        'Toutes les fonctionnalités Pro',
        'Alertes sonores et WhatsApp instantanées',
        'Détecteur avancé Palpable Error',
        'Simulateur multi-comptes pour contourner les plafonds',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white font-display">
              Profil Utilisateur & Paramètres
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifiant : rolandyapovictorien@gmail.com · Localisation : Côte d'Ivoire
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Configuration du fuseau horaire */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-white flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-400" />
            <span>Fuseau Horaire d'Affichage des Matchs</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {timezones.map((tz) => (
              <button
                key={tz.id}
                onClick={() => onChangeTimezone(tz.id)}
                className={`p-2.5 text-left rounded-lg border text-xs transition-colors ${
                  timezone === tz.id
                    ? 'border-emerald-500 bg-emerald-500/10 text-white font-medium'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {tz.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grille des Forfaits & Abonnements */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <span>Forfaits d'Abonnement (Facturation en FCFA)</span>
            </label>
            <span className="text-[11px] text-slate-400">Simulation de compte</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier) => {
              const isCurrent = currentTier === tier.id;

              return (
                <div
                  key={tier.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between space-y-4 transition-all ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-slate-800 bg-slate-950'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm">{tier.name}</h3>
                      {tier.isPopular && (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                          Populaire
                        </span>
                      )}
                    </div>

                    <div className="font-mono text-lg font-bold text-white tabular-nums">
                      {tier.price === 0 ? 'Gratuit' : `${formatFcfa(tier.price)}`}
                      {tier.price > 0 && <span className="text-xs text-slate-500 font-normal"> /mois</span>}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-normal">
                      {tier.description}
                    </p>

                    <ul className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                      {tier.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => onSelectTier(tier.id)}
                    className={`w-full py-2 text-xs font-semibold rounded-lg transition-colors ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                    }`}
                  >
                    {isCurrent ? 'Forfait Actif' : 'Sélectionner ce forfait'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Fermer les paramètres
          </button>
        </div>
      </div>
    </div>
  );
};
