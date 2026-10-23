# LOT 4 — Corrections et tests du moteur Surebet Africa AI

## Corrections appliquées

1. **Provenance explicite** : `normalizeTheOddsApiEvents` prend désormais un paramètre `provenance` (`real` ou `demo`). Par défaut, il classe les données comme démo ; le connecteur officiel doit explicitement passer `real` après une réponse obtenue du fournisseur. Les fixtures de tests ne sont donc plus automatiquement étiquetées réelles.
2. **Fraîcheur vérifiable** : une cote sans `market.last_update` ni `book.last_update` est rejetée au lieu de recevoir artificiellement l'heure de collecte.
3. **Horodatages futurs** : les dates situées à plus de 120 secondes dans le futur sont rejetées.
4. **Diversité des bookmakers** : le moteur exige au moins deux bookmakers distincts pour une opportunité cross-bookmaker.
5. **État live** : `commence_time` seul ne permet pas de prouver qu'un match est en direct. L'adaptateur marque donc les rencontres comme non-live tant qu'une source de statut live fiable n'est pas intégrée.
6. **Cotes invalides** : `calculateSumOfInverses` renvoie `Infinity` pour une liste vide ou contenant une cote invalide, afin d'échouer en sécurité et d'empêcher un faux positif.
7. **Quota** : le statut du fournisseur ne prétend pas connaître une limite journalière fixe ; les en-têtes de quota du fournisseur restent la source de vérité.

## Tests de régression ajoutés

- Les fixtures synthétiques sont explicitement en mode démo.
- La provenance réelle n'est affichée que si elle est explicitement fournie par le connecteur.
- Les cotes sans horodatage sont rejetées.
- Les horodatages anormalement futurs sont rejetés.
- Les opportunités issues d'un seul bookmaker sont rejetées.
- Les listes de cotes vides ou invalides ne peuvent pas produire de surebet.
- Les horodatages futurs ne sont pas considérés comme frais.

## Lancer les tests

```bash
npm install
npm test
npm run lint
npm run build
```

## Limites connues

- Aucun appel réseau réel n'a été effectué dans cet audit ; une clé API valide est nécessaire pour la validation en direct.
- The Odds API V4 ne permet pas de déduire l'état « en direct » uniquement depuis `commence_time`. Une source complémentaire de statut live serait nécessaire.
- Les règles de règlement, prolongations, abandons, limites de mises, commissions et mouvements de cotes doivent encore être confirmés par bookmaker avant toute décision réelle.
- La compilation complète n'a pas pu être validée dans l'environnement de génération car l'installation des dépendances a expiré. Exécuter les commandes ci-dessus dans l'environnement Google AI Studio ou local.
