# Plateforme intelligente de gestion des stages (SIMP)

Application web permettant de centraliser la gestion des stagiaires, des sujets de stage, des affectations et des évaluations, avec un module d'import et d'extraction assistée pour les sujets de stage (PDF, Word, Excel, CSV, JSON, ou URL externe).

Projet réalisé dans le cadre d'un stage chez LEONI Wiring Systems — Sousse.

## Structure du dépôt

```
Plateforme-Stage/
├── backend/     API FastAPI (Python) — voir backend/README.md
└── frontend/    Interface React (Vite) — voir frontend/README.md
```

## Démarrage rapide

1. **Backend** : suivre les instructions dans [`backend/README.md`](backend/README.md)
2. **Frontend** : suivre les instructions dans [`frontend/README.md`](frontend/README.md)

Le backend doit être lancé avant le frontend (l'interface consomme l'API REST exposée par le backend).

## Fonctionnalités principales

- Gestion des stagiaires (profils, statut, archivage)
- Gestion des sujets de stage (recherche multicritère, détection d'obsolescence)
- Import et extraction assistée de sujets à partir de documents ou d'une source externe
- Gestion des affectations et recommandation automatique
- Évaluations des stagiaires
- Authentification par rôle (admin, encadrant, stagiaire)

## Auteur

Hdhili Samar — Institut Supérieur d'Informatique du Kef
