# Vauban · Observations en sports collectifs

Application statique sans dépendance, conçue pour l’observation en EPS sur iPad.

- Classes et listes d’élèves collées, un nom par ligne ; ajout sans supprimer les anciens élèves.
- Équipes de 3 à 6 élèves, créées en touchant les cartes ; noms et couleurs modifiables.
- Présences par séance ; l’élève absent reste dans son équipe.
- Critères individuels (tous les élèves ou élèves choisis) et collectifs, avec quatre niveaux, réussite binaire ou compteur.
- Page par équipe ; observations générales et observations de chaque match stockées séparément.
- Un même match et ses scores accessibles depuis les deux équipes ; scores incomplets exclus du classement.
- Nouvelle séance avec reprise facultative des équipes et critères, sans écraser la précédente.
- Bilan par séance, parcours par élève et export HTML imprimable.
- Sauvegarde locale, export/import JSON validé ; aucune transmission des listes d’élèves à un serveur.
- Service worker pour une utilisation hors ligne après une première ouverture en ligne.

## Utilisation

Créer une classe → composer les équipes → choisir les critères → Sur le terrain → Bilan.

La démo utilise uniquement des élèves fictifs. Une case vide signifie « non observé ». Les compteurs conservent la distinction entre absence d’observation et zéro. Le classement utilise 3 points par victoire et 1 par nul.

Les données ne se synchronisent pas entre appareils : exporter le JSON pour les transférer. Les séances conservent leurs équipes ; les IDs élèves permettent de suivre leur parcours malgré les changements d’équipe. Les critères déjà utilisés gardent leur format.

## Hébergement

Servir le dossier par HTTPS (Vercel : preset Other, pas de build, dossier de sortie racine). Aucun paquet à installer, aucune clé à configurer. Le mode hors ligne nécessite HTTPS, ou localhost pour le développement.

## Vérification

`node tests/core.test.cjs`

Les tests couvrent l’affectation unique, les cibles individuelles, les scores incomplets, le classement, l’historique entre séances et la validation des sauvegardes.
