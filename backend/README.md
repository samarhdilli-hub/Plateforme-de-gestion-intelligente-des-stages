# Plateforme intelligente de gestion des stages — Backend

## Présentation

API du système de gestion des stages : fiches stagiaires, catalogue de
sujets de stage, affectations, évaluations, et import automatisé de
sujets à partir de documents ou de sources externes (IA par règles).

## Fonctionnalités

- **Stagiaires** : création, modification, archivage/réactivation,
  suppression (protégée si des affectations existent), recherche.
- **Sujets de stage** : CRUD complet, détection automatique des sujets
  obsolètes (disponibles depuis plus de 90 jours), recherche par
  catégorie, statut, durée, localisation et niveau requis.
- **Import intelligent de sujets** : à partir de PDF, Word, Excel, CSV,
  JSON, ou d'une URL (export d'un système externe). Extraction
  automatique des champs, catégorisation par domaine métier, détection
  de doublons, OCR de secours pour les PDF scannés.
- **Affectations** : liaison stagiaire ↔ sujet, avec synchronisation
  automatique du statut du sujet (Disponible / Attribué).
- **Évaluations** : notation (sur 20) et commentaire, rattachés à une
  affectation.
- **Recommandation intelligente** : suggestion du sujet le plus
  pertinent pour un stagiaire donné, selon sa spécialité et son niveau
  d'étude.
- **Utilisateurs et rôles** : admin / encadrant / stagiaire,
  authentification par jeton JWT, protection du dernier compte admin.

## Architecture

```
backend/
├── main.py                 # création de l'app, CORS, montage des routers
├── database.py              # connexion DB (SQLAlchemy) + dépendance get_db
├── models.py                 # tables SQLAlchemy
├── schemas.py                # schémas Pydantic (validation des requêtes/réponses)
├── ia_import.py               # extraction, catégorisation, détection de doublons, OCR
│
├── routers/                   # endpoints HTTP, un fichier par ressource
│   ├── auth.py                  # /login, /moi
│   ├── stagiaires.py
│   ├── sujets.py                # CRUD + import (fichier / URL / confirmation)
│   ├── affectations.py
│   ├── evaluations.py
│   ├── recommandations.py
│   └── utilisateurs.py
│
└── services/                  # logique métier réutilisable, indépendante du HTTP
    ├── security.py               # JWT, hachage des mots de passe, dépendances de rôle
    ├── sujets_service.py         # aperçu d'import, calcul d'obsolescence
    ├── affectations_service.py   # synchronisation du statut sujet ↔ affectation
    ├── recommandation_service.py # scoring de recommandation
    └── utilisateurs_service.py   # règles métier (dernier admin, création de compte)
```

Chaque router ne contient que la déclaration des endpoints (validation
des entrées, appel à la base ou à un service, mise en forme de la
réponse). La logique un peu plus complexe (calculs, règles métier
transversales) vit dans `services/`, pour rester testable indépendamment
du framework web.

## Technologies

- **FastAPI** — framework web asynchrone, validation et documentation
  automatiques (OpenAPI).
- **SQLAlchemy** — ORM, compatible PostgreSQL (production) et SQLite
  (tests locaux).
- **Pydantic** — validation des schémas d'entrée/sortie.
- **PyJWT** + **pwdlib (Argon2)** — authentification par jeton et
  hachage des mots de passe.
- **pypdf**, **python-docx**, **openpyxl** — lecture de fichiers PDF,
  Word et Excel pour l'import de sujets.
- **pytesseract** + **pdf2image** (Tesseract OCR) — secours pour les
  PDF scannés (sans texte sélectionnable).
- **requests** — récupération de contenu distant pour l'import via URL.

## Prérequis

- Python 3.11 ou supérieur
- PostgreSQL (ou SQLite pour un usage local rapide)
- Pour l'OCR (optionnel mais recommandé) : Tesseract OCR et Poppler
  installés sur la machine.
  - Windows : [Tesseract](https://github.com/UB-Mannheim/tesseract/wiki),
    [Poppler](https://github.com/oschwartz10612/poppler-windows/releases)
  - Linux : `sudo apt install tesseract-ocr tesseract-ocr-fra poppler-utils`
  - macOS : `brew install tesseract tesseract-lang poppler`

  Sans ces programmes, l'application fonctionne normalement : l'OCR est
  simplement ignoré (secours silencieux) et seuls les PDF avec du texte
  sélectionnable pourront être importés.

## Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows : venv\Scripts\activate
pip install -r requirements.txt
```

## Configuration (.env)

Créez un fichier `.env` à la racine du dossier `backend/` :

```env
DATABASE_URL=postgresql://utilisateur:motdepasse@localhost:5432/nom_de_la_base
JWT_SECRET_KEY=une-chaine-secrete-longue-et-aleatoire
```

- `DATABASE_URL` est obligatoire (l'application refuse de démarrer sans
  elle). Pour un test local rapide sans PostgreSQL, une base SQLite
  fonctionne aussi : `sqlite:///./stages.db`.
- `JWT_SECRET_KEY` est fortement recommandée : sans elle, une clé
  aléatoire temporaire est générée à chaque démarrage, ce qui invalide
  tous les jetons existants à chaque redémarrage du serveur.

**Important — pas de migrations (Alembic) :** `Base.metadata.create_all()`
crée les tables manquantes mais n'ajoute pas de colonnes à une table déjà
existante. Sur une base déjà en place, pensez à la recréer (dev) ou à
ajouter les colonnes manuellement si le schéma évolue.

## Lancement backend

```bash
uvicorn main:app --reload --port 5050
```

L'API est alors disponible sur `http://127.0.0.1:5050`, avec la
documentation interactive sur `http://127.0.0.1:5050/docs`.

## API

Toutes les routes (sauf `/login` et la création du tout premier compte)
nécessitent un jeton JWT dans l'en-tête `Authorization: Bearer <token>`.

| Ressource | Endpoints principaux |
|---|---|
| Authentification | `POST /login`, `GET /moi` |
| Stagiaires | `GET/POST /stagiaires`, `PUT /stagiaires/{id}`, `PUT /stagiaires/{id}/archiver`, `PUT /stagiaires/{id}/reactiver`, `DELETE /stagiaires/{id}` |
| Sujets | `GET/POST /sujets`, `PUT/DELETE /sujets/{id}`, `GET /sujets/obsoletes` |
| Import de sujets | `POST /sujets/importer` (fichier), `POST /sujets/importer-url`, `POST /sujets/importer/confirmer` |
| Affectations | `GET/POST /affectations`, `PUT/DELETE /affectations/{id}` |
| Évaluations | `GET/POST /evaluations`, `PUT/DELETE /evaluations/{id}`, `GET /affectations/{id}/evaluation` |
| Recommandation | `POST /recommander-sujet/{stagiaire_id}` |
| Utilisateurs | `GET/POST /utilisateurs`, `PUT/DELETE /utilisateurs/{id}` |

Le détail complet des schémas de requête/réponse est disponible sur
`/docs` une fois le serveur lancé.

## IA / Matching

L'« intelligence » du système repose sur des **règles et heuristiques**,
pas sur un modèle de deep learning (pas de spaCy/BERT) :

- **Extraction** (`ia_import.py`) : détection de labels par expressions
  régulières (`Titre :`, `Entreprise :`...) dans les fichiers texte/PDF/
  Word, et par en-têtes de colonnes pour Excel/CSV/JSON.
- **OCR de secours** : si l'extraction de texte directe d'un PDF renvoie
  presque rien (cas d'un scan), une conversion en images + OCR
  (Tesseract) est tentée automatiquement.
- **Catégorisation** : score de correspondance à des listes de
  mots-clés par domaine métier (Développement Web, Data/IA, Mobile,
  Réseaux & Systèmes, Cybersécurité).
- **Détection de doublons** : similarité de chaînes (`SequenceMatcher`)
  entre titres, seuil à 80 %.
- **Détection d'obsolescence** : un sujet resté "Disponible" plus de 90
  jours est signalé comme potentiellement obsolète.
- **Recommandation** : score construit à partir de la correspondance
  entre la spécialité/niveau d'étude du stagiaire et les
  technologies/niveau requis du sujet.

Ce choix privilégie la prévisibilité, la rapidité et l'absence de
dépendance à un modèle lourd, au prix d'une compréhension moins fine du
texte qu'un vrai modèle de NLP.

## Auteurs

Projet réalisé dans le cadre d'un stage — Plateforme de gestion
intelligente des stages.
