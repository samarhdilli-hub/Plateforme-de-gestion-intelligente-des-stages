import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pwdlib import PasswordHash

import ia_import
from database import engine, Base, SessionLocal

# Charge le fichier .env (database.py le fait déjà, mais on le refait ici
# explicitement pour que ce module ne dépende pas de l'ordre d'import).
load_dotenv()

from models import (
    Stagiaire,
    SujetStage,
    Affectation,
    Utilisateur,
)

from schemas import (
    StagiaireCreate,
    StagiaireResponse,
    SujetCreate,
    SujetResponse,
    AffectationCreate,
    AffectationResponse,
    UtilisateurCreate,
    UtilisateurResponse,
    LoginRequest,
    Token,
    ResultatImportSujets,
)


# =========================================================
# CONSTANTES
# =========================================================

password_hash = PasswordHash.recommended()

ROLES_AUTORISES = ["admin", "encadrant", "stagiaire"]

TECHNOLOGIES_CONNUES = [
    "python", "java", "javascript", "react", "fastapi",
    "postgresql", "sql", "html", "css", "c++", "c",
    "php", "angular", "vue", "node",
]

# =========================================================
# CONFIGURATION JWT
# =========================================================
#
# ⚠️ SECRET_KEY : DOIT être définie dans le fichier .env (variable
# JWT_SECRET_KEY). Une valeur de secours n'est utilisée qu'en dernier
# recours pour ne pas bloquer un tout premier lancement en local, mais
# elle affiche un avertissement — ne jamais l'utiliser en production.

SECRET_KEY = os.environ.get("JWT_SECRET_KEY")

if not SECRET_KEY:
    import secrets

    SECRET_KEY = secrets.token_hex(32)
    print(
        "⚠️  JWT_SECRET_KEY n'est pas définie dans .env : une clé "
        "temporaire aléatoire a été générée pour cette session. "
        "Tous les jetons émis seront invalidés au prochain redémarrage. "
        "Ajoutez JWT_SECRET_KEY à votre fichier .env pour une clé stable."
    )

ALGORITHM = "HS256"

DUREE_VALIDITE_TOKEN_MINUTES = 60

# Indique à FastAPI où se trouve la route de connexion
# (utilisé pour générer la doc /docs et extraire le token du header)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# =========================================================
# APPLICATION
# =========================================================

app = FastAPI(
    title="Plateforme intelligente de gestion des stages",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# BASE DE DONNÉES
# =========================================================

Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================================
# OUTILS
# =========================================================

def valider_role(role: str):
    """Vérifie que le rôle fourni fait partie des rôles autorisés."""

    if role not in ROLES_AUTORISES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Rôle invalide. "
                "Utilisez : admin, encadrant ou stagiaire."
            )
        )


def creer_token_acces(utilisateur_id: int, role: str) -> str:
    """Génère un jeton JWT signé, contenant l'id et le rôle
    de l'utilisateur, valide pour une durée limitée."""

    expiration = (
        datetime.now(timezone.utc)
        + timedelta(minutes=DUREE_VALIDITE_TOKEN_MINUTES)
    )

    contenu = {
        "sub": str(utilisateur_id),
        "role": role,
        "exp": expiration,
    }

    return jwt.encode(contenu, SECRET_KEY, algorithm=ALGORITHM)


def utilisateur_courant(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Utilisateur:
    """Dépendance FastAPI : décode le jeton JWT reçu dans l'en-tête
    Authorization, et renvoie l'utilisateur correspondant.
    À utiliser avec Depends() sur toute route qui doit être protégée."""

    erreur_authentification = HTTPException(
        status_code=401,
        detail="Identifiants invalides ou expirés",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        contenu = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        utilisateur_id = contenu.get("sub")

        if utilisateur_id is None:
            raise erreur_authentification

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Session expirée, veuillez vous reconnecter",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise erreur_authentification

    utilisateur = (
        db.query(Utilisateur)
        .filter(Utilisateur.id == int(utilisateur_id))
        .first()
    )

    if utilisateur is None:
        raise erreur_authentification

    if not utilisateur.actif:
        raise HTTPException(
            status_code=403,
            detail="Ce compte a été désactivé"
        )

    return utilisateur


# Variante de la dépendance d'authentification qui ne bloque pas
# s'il n'y a pas de jeton (renvoie None au lieu de lever une erreur).
# Utilisée uniquement pour la création du tout premier compte.
oauth2_scheme_optionnel = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)


def utilisateur_courant_optionnel(
    token: str | None = Depends(oauth2_scheme_optionnel),
    db: Session = Depends(get_db)
) -> Utilisateur | None:
    if not token:
        return None

    try:
        return utilisateur_courant(token=token, db=db)
    except HTTPException:
        return None


def exiger_roles(*roles_autorises: str):
    """Fabrique une dépendance FastAPI qui vérifie que l'utilisateur
    connecté possède l'un des rôles autorisés, en plus d'être authentifié.

    Exemple d'utilisation sur une route :
        utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
    """

    def verification(
        utilisateur: Utilisateur = Depends(utilisateur_courant)
    ) -> Utilisateur:
        if utilisateur.role not in roles_autorises:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Vous n'avez pas les droits nécessaires "
                    "pour effectuer cette action."
                )
            )

        return utilisateur

    return verification


# =========================================================
# ROUTE TEST
# =========================================================

@app.get("/")
def accueil():
    return {
        "message": "API Plateforme de gestion des stages fonctionne"
    }


# =========================================================
# AUTHENTIFICATION
# =========================================================

@app.post("/login", response_model=Token)
def login(identifiants: LoginRequest, db: Session = Depends(get_db)):

    erreur = HTTPException(
        status_code=401,
        detail="Email ou mot de passe incorrect"
    )

    utilisateur = (
        db.query(Utilisateur)
        .filter(Utilisateur.email == identifiants.email)
        .first()
    )

    if not utilisateur:
        raise erreur

    if not password_hash.verify(identifiants.mot_de_passe, utilisateur.mot_de_passe):
        raise erreur

    if not utilisateur.actif:
        raise HTTPException(
            status_code=403,
            detail="Ce compte a été désactivé"
        )

    jeton = creer_token_acces(
        utilisateur_id=utilisateur.id,
        role=utilisateur.role,
    )

    return {
        "access_token": jeton,
        "token_type": "bearer",
        "role": utilisateur.role,
    }


@app.get("/moi", response_model=UtilisateurResponse)
def get_utilisateur_courant(
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    """Renvoie le profil de l'utilisateur actuellement connecté,
    à partir du jeton JWT envoyé dans l'en-tête Authorization."""

    return utilisateur


# =========================================================
# STAGIAIRES
# =========================================================

@app.get("/stagiaires", response_model=list[StagiaireResponse])
def get_stagiaires(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    return db.query(Stagiaire).all()


@app.get("/stagiaires/{stagiaire_id}", response_model=StagiaireResponse)
def get_stagiaire(
    stagiaire_id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    stagiaire = (
        db.query(Stagiaire)
        .filter(Stagiaire.id == stagiaire_id)
        .first()
    )

    if not stagiaire:
        raise HTTPException(status_code=404, detail="Stagiaire introuvable")

    return stagiaire


@app.post("/stagiaires", response_model=StagiaireResponse)
def ajouter_stagiaire(
    stagiaire: StagiaireCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    ancien = (
        db.query(Stagiaire)
        .filter(Stagiaire.email == stagiaire.email)
        .first()
    )

    if ancien:
        raise HTTPException(
            status_code=400,
            detail="Un stagiaire avec cet email existe déjà"
        )

    nouveau_stagiaire = Stagiaire(
        nom=stagiaire.nom,
        prenom=stagiaire.prenom,
        date_naissance=stagiaire.date_naissance,
        email=stagiaire.email,
        telephone=stagiaire.telephone,
        universite=stagiaire.universite,
        specialite=stagiaire.specialite,
        date_debut=stagiaire.date_debut,
        date_fin=stagiaire.date_fin,
        statut=stagiaire.statut,
    )

    db.add(nouveau_stagiaire)
    db.commit()
    db.refresh(nouveau_stagiaire)

    return nouveau_stagiaire


@app.put("/stagiaires/{stagiaire_id}", response_model=StagiaireResponse)
def modifier_stagiaire(
    stagiaire_id: int,
    stagiaire: StagiaireCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    ancien = (
        db.query(Stagiaire)
        .filter(Stagiaire.id == stagiaire_id)
        .first()
    )

    if not ancien:
        raise HTTPException(status_code=404, detail="Stagiaire introuvable")

    email_en_conflit = (
        db.query(Stagiaire)
        .filter(
            Stagiaire.email == stagiaire.email,
            Stagiaire.id != stagiaire_id
        )
        .first()
    )

    if email_en_conflit:
        raise HTTPException(
            status_code=400,
            detail="Un autre stagiaire utilise déjà cet email"
        )

    ancien.nom = stagiaire.nom
    ancien.prenom = stagiaire.prenom
    ancien.date_naissance = stagiaire.date_naissance
    ancien.email = stagiaire.email
    ancien.telephone = stagiaire.telephone
    ancien.universite = stagiaire.universite
    ancien.specialite = stagiaire.specialite
    ancien.date_debut = stagiaire.date_debut
    ancien.date_fin = stagiaire.date_fin
    ancien.statut = stagiaire.statut

    db.commit()
    db.refresh(ancien)

    return ancien


@app.delete("/stagiaires/{stagiaire_id}")
def supprimer_stagiaire(
    stagiaire_id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    stagiaire = (
        db.query(Stagiaire)
        .filter(Stagiaire.id == stagiaire_id)
        .first()
    )

    if not stagiaire:
        raise HTTPException(status_code=404, detail="Stagiaire introuvable")

    db.delete(stagiaire)
    db.commit()

    return {"message": "Stagiaire supprimé avec succès"}


# =========================================================
# SUJETS DE STAGE
# =========================================================

@app.get("/sujets", response_model=list[SujetResponse])
def get_sujets(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    return db.query(SujetStage).all()


@app.get("/sujets/{sujet_id}", response_model=SujetResponse)
def get_sujet(
    sujet_id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    sujet = (
        db.query(SujetStage)
        .filter(SujetStage.id == sujet_id)
        .first()
    )

    if not sujet:
        raise HTTPException(status_code=404, detail="Sujet introuvable")

    return sujet


@app.post("/sujets", response_model=SujetResponse)
def ajouter_sujet(
    sujet: SujetCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    nouveau_sujet = SujetStage(
        titre=sujet.titre,
        description=sujet.description,
        entreprise=sujet.entreprise,
        technologies=sujet.technologies,
        duree=sujet.duree,
        statut=sujet.statut,
    )

    db.add(nouveau_sujet)
    db.commit()
    db.refresh(nouveau_sujet)

    return nouveau_sujet


@app.put("/sujets/{sujet_id}", response_model=SujetResponse)
def modifier_sujet(
    sujet_id: int,
    sujet: SujetCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    ancien = (
        db.query(SujetStage)
        .filter(SujetStage.id == sujet_id)
        .first()
    )

    if not ancien:
        raise HTTPException(status_code=404, detail="Sujet introuvable")

    ancien.titre = sujet.titre
    ancien.description = sujet.description
    ancien.entreprise = sujet.entreprise
    ancien.technologies = sujet.technologies
    ancien.duree = sujet.duree
    ancien.statut = sujet.statut

    db.commit()
    db.refresh(ancien)

    return ancien


@app.delete("/sujets/{sujet_id}")
def supprimer_sujet(
    sujet_id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    sujet = (
        db.query(SujetStage)
        .filter(SujetStage.id == sujet_id)
        .first()
    )

    if not sujet:
        raise HTTPException(status_code=404, detail="Sujet introuvable")

    db.delete(sujet)
    db.commit()

    return {"message": "Sujet supprimé avec succès"}


# =========================================================
# 🤖 IMPORT INTELLIGENT DE SUJETS (PDF / Word / Excel)
# =========================================================
#
# Étape 1 — /sujets/importer : lit le fichier envoyé, en extrait des
# sujets candidats, les catégorise et détecte les doublons probables.
# Rien n'est encore enregistré : le frontend affiche un aperçu et laisse
# l'utilisateur choisir quels sujets importer réellement.
#
# Étape 2 — /sujets/importer/confirmer : enregistre en base uniquement
# les sujets sélectionnés par l'utilisateur.

@app.post("/sujets/importer", response_model=ResultatImportSujets)
async def importer_sujets(
    fichier: UploadFile = File(...),
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    contenu = await fichier.read()

    try:
        sujets_bruts = ia_import.lire_fichier(fichier.filename or "", contenu)
    except ValueError as erreur:
        raise HTTPException(status_code=400, detail=str(erreur))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Impossible de lire ce fichier. Vérifiez qu'il n'est pas corrompu."
        )

    if not sujets_bruts:
        raise HTTPException(
            status_code=422,
            detail="Aucun sujet n'a pu être extrait de ce fichier."
        )

    sujets_existants = db.query(SujetStage).all()

    resultats = []

    for sujet_brut in sujets_bruts:
        categorie = ia_import.categoriser_sujet(sujet_brut)

        doublon, score_similarite = ia_import.detecter_doublon(
            sujet_brut["titre"], sujets_existants
        )

        resultats.append({
            "titre": sujet_brut["titre"],
            "description": sujet_brut.get("description") or None,
            "entreprise": sujet_brut.get("entreprise"),
            "technologies": sujet_brut.get("technologies"),
            "duree": sujet_brut.get("duree"),
            "statut": "Disponible",
            "categorie": categorie,
            "doublon_probable": (
                {
                    "id": doublon.id,
                    "titre": doublon.titre,
                    "similarite": score_similarite,
                }
                if doublon else None
            ),
        })

    return {
        "nombre_extrait": len(resultats),
        "nombre_doublons_potentiels": sum(
            1 for r in resultats if r["doublon_probable"]
        ),
        "sujets_extraits": resultats,
    }


@app.post("/sujets/importer/confirmer", response_model=list[SujetResponse])
def confirmer_import_sujets(
    sujets: list[SujetCreate],
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    if not sujets:
        raise HTTPException(
            status_code=400,
            detail="Aucun sujet à importer."
        )

    nouveaux_sujets = []

    for sujet in sujets:
        nouveau_sujet = SujetStage(
            titre=sujet.titre,
            description=sujet.description,
            entreprise=sujet.entreprise,
            technologies=sujet.technologies,
            duree=sujet.duree,
            statut=sujet.statut or "Disponible",
            categorie=sujet.categorie,
        )
        db.add(nouveau_sujet)
        nouveaux_sujets.append(nouveau_sujet)

    db.commit()

    for sujet in nouveaux_sujets:
        db.refresh(sujet)

    return nouveaux_sujets


# =========================================================
# AFFECTATIONS
# =========================================================

@app.get("/affectations", response_model=list[AffectationResponse])
def get_affectations(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    return db.query(Affectation).all()


@app.post("/affectations", response_model=AffectationResponse)
def ajouter_affectation(
    affectation: AffectationCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    stagiaire = (
        db.query(Stagiaire)
        .filter(Stagiaire.id == affectation.stagiaire_id)
        .first()
    )

    if not stagiaire:
        raise HTTPException(status_code=404, detail="Stagiaire introuvable")

    sujet = (
        db.query(SujetStage)
        .filter(SujetStage.id == affectation.sujet_id)
        .first()
    )

    if not sujet:
        raise HTTPException(status_code=404, detail="Sujet introuvable")

    nouvelle_affectation = Affectation(
        stagiaire_id=affectation.stagiaire_id,
        sujet_id=affectation.sujet_id,
        date_affectation=affectation.date_affectation,
        statut=affectation.statut,
    )

    db.add(nouvelle_affectation)

    sujet.statut = "Attribué"

    db.commit()
    db.refresh(nouvelle_affectation)

    return nouvelle_affectation


@app.put("/affectations/{affectation_id}", response_model=AffectationResponse)
def modifier_affectation(
    affectation_id: int,
    affectation: AffectationCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    ancienne = (
        db.query(Affectation)
        .filter(Affectation.id == affectation_id)
        .first()
    )

    if not ancienne:
        raise HTTPException(status_code=404, detail="Affectation introuvable")

    ancienne.stagiaire_id = affectation.stagiaire_id
    ancienne.sujet_id = affectation.sujet_id
    ancienne.date_affectation = affectation.date_affectation
    ancienne.statut = affectation.statut

    db.commit()
    db.refresh(ancienne)

    return ancienne


@app.delete("/affectations/{affectation_id}")
def supprimer_affectation(
    affectation_id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    affectation = (
        db.query(Affectation)
        .filter(Affectation.id == affectation_id)
        .first()
    )

    if not affectation:
        raise HTTPException(status_code=404, detail="Affectation introuvable")

    db.delete(affectation)
    db.commit()

    return {"message": "Affectation supprimée avec succès"}


# =========================================================
# 🤖 RECOMMANDATION INTELLIGENTE
# =========================================================

@app.post("/recommander-sujet/{stagiaire_id}")
def recommander_sujet(
    stagiaire_id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):

    stagiaire = (
        db.query(Stagiaire)
        .filter(Stagiaire.id == stagiaire_id)
        .first()
    )

    if not stagiaire:
        raise HTTPException(status_code=404, detail="Stagiaire introuvable")

    tous_les_sujets = db.query(SujetStage).all()

    sujets_disponibles = [
        sujet for sujet in tous_les_sujets
        if (sujet.statut or "").strip().lower() == "disponible"
    ]

    if not sujets_disponibles:
        raise HTTPException(
            status_code=404,
            detail="Aucun sujet disponible"
        )

    specialite = (stagiaire.specialite or "").strip().lower()

    recommandations = []

    for sujet in sujets_disponibles:

        score = 0
        raisons = []

        titre = (sujet.titre or "").strip().lower()
        description = (sujet.description or "").strip().lower()
        entreprise = (sujet.entreprise or "").strip().lower()
        technologies = (sujet.technologies or "").strip().lower()

        texte_complet = " ".join(
            [titre, description, entreprise, technologies]
        )

        if specialite:
            mots_specialite = specialite.split()

            mots_trouves = [
                mot for mot in mots_specialite
                if len(mot) >= 3 and mot in texte_complet
            ]

            if mots_trouves:
                score += len(mots_trouves) * 20
                raisons.append(
                    "La spécialité du stagiaire correspond au sujet."
                )

        technologies_trouvees = [
            technologie for technologie in TECHNOLOGIES_CONNUES
            if technologie in specialite and technologie in texte_complet
        ]

        if technologies_trouvees:
            score += len(technologies_trouvees) * 15
            raisons.append(
                "Les technologies du sujet correspondent au profil."
            )

        if description:
            score += 5
            raisons.append("Le sujet possède une description.")

        if technologies:
            score += 5

        recommandations.append({
            "sujet": sujet,
            "score": score,
            "raisons": raisons,
        })

    recommandations.sort(key=lambda x: x["score"], reverse=True)

    meilleur = recommandations[0]
    sujet = meilleur["sujet"]
    raisons = meilleur["raisons"] or [
        "Sujet disponible.",
        "Le sujet peut être étudié pour ce profil.",
    ]

    return {
        "stagiaire": {
            "id": stagiaire.id,
            "nom": stagiaire.nom,
            "prenom": stagiaire.prenom,
            "specialite": stagiaire.specialite,
        },

        "sujet_recommande": {
            "id": sujet.id,
            "titre": sujet.titre,
            "description": sujet.description,
            "entreprise": sujet.entreprise,
            "technologies": sujet.technologies,
            "duree": sujet.duree,
            "statut": sujet.statut,
        },

        "score": min(meilleur["score"], 100),
        "raisons": raisons,

        "autres_sujets": [
            {
                "id": element["sujet"].id,
                "titre": element["sujet"].titre,
                "entreprise": element["sujet"].entreprise,
                "technologies": element["sujet"].technologies,
                "score": min(element["score"], 100),
            }
            for element in recommandations[1:4]
        ],
    }


# =========================================================
# 👤 UTILISATEURS
# =========================================================

@app.get("/utilisateurs", response_model=list[UtilisateurResponse])
def get_utilisateurs(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin"))
):
    return db.query(Utilisateur).all()


@app.get("/utilisateurs/{utilisateur_id}", response_model=UtilisateurResponse)
def get_utilisateur(
    utilisateur_id: int,
    db: Session = Depends(get_db),
    utilisateur_actuel: Utilisateur = Depends(exiger_roles("admin"))
):
    utilisateur = (
        db.query(Utilisateur)
        .filter(Utilisateur.id == utilisateur_id)
        .first()
    )

    if not utilisateur:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    return utilisateur


@app.post("/utilisateurs", response_model=UtilisateurResponse)
def ajouter_utilisateur(
    utilisateur: UtilisateurCreate,
    db: Session = Depends(get_db),
    utilisateur_actuel: Utilisateur | None = Depends(utilisateur_courant_optionnel)
):
    nombre_utilisateurs_existants = db.query(Utilisateur).count()

    # Si des comptes existent déjà, il faut être connecté en tant qu'admin
    # pour en créer un de plus. Si la table est vide (tout premier lancement),
    # on autorise la création sans authentification — c'est la seule façon
    # de créer le compte admin initial.
    if nombre_utilisateurs_existants > 0:
        if utilisateur_actuel is None:
            raise HTTPException(
                status_code=401,
                detail="Authentification requise pour créer un utilisateur"
            )
        if utilisateur_actuel.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Seul un administrateur peut créer un utilisateur"
            )

    ancien = (
        db.query(Utilisateur)
        .filter(Utilisateur.email == utilisateur.email)
        .first()
    )

    if ancien:
        raise HTTPException(
            status_code=400,
            detail="Un utilisateur avec cet email existe déjà"
        )

    valider_role(utilisateur.role)

    # Le tout premier compte créé sur une base vide devient automatiquement
    # admin, quel que soit le rôle demandé — pour garantir qu'il existe
    # toujours au moins un administrateur capable de gérer les autres comptes.
    role_final = (
        "admin" if nombre_utilisateurs_existants == 0 else utilisateur.role
    )

    mot_de_passe_hache = password_hash.hash(utilisateur.mot_de_passe)

    nouvel_utilisateur = Utilisateur(
        nom=utilisateur.nom,
        prenom=utilisateur.prenom,
        email=utilisateur.email,
        mot_de_passe=mot_de_passe_hache,
        role=role_final,
        actif=utilisateur.actif,
    )

    db.add(nouvel_utilisateur)
    db.commit()
    db.refresh(nouvel_utilisateur)

    return nouvel_utilisateur


@app.put("/utilisateurs/{utilisateur_id}", response_model=UtilisateurResponse)
def modifier_utilisateur(
    utilisateur_id: int,
    utilisateur: UtilisateurCreate,
    db: Session = Depends(get_db),
    utilisateur_actuel: Utilisateur = Depends(exiger_roles("admin"))
):
    ancien = (
        db.query(Utilisateur)
        .filter(Utilisateur.id == utilisateur_id)
        .first()
    )

    if not ancien:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    email_existant = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.email == utilisateur.email,
            Utilisateur.id != utilisateur_id
        )
        .first()
    )

    if email_existant:
        raise HTTPException(
            status_code=400,
            detail="Cet email est déjà utilisé"
        )

    valider_role(utilisateur.role)

    devient_non_admin = ancien.role == "admin" and (
        utilisateur.role != "admin" or not utilisateur.actif
    )

    if devient_non_admin:
        nombre_admins = (
            db.query(Utilisateur)
            .filter(Utilisateur.role == "admin")
            .count()
        )

        if nombre_admins <= 1:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Impossible de retirer le rôle admin ou de désactiver "
                    "le dernier compte administrateur."
                )
            )

    ancien.nom = utilisateur.nom
    ancien.prenom = utilisateur.prenom
    ancien.email = utilisateur.email
    ancien.mot_de_passe = password_hash.hash(utilisateur.mot_de_passe)
    ancien.role = utilisateur.role
    ancien.actif = utilisateur.actif

    db.commit()
    db.refresh(ancien)

    return ancien


@app.delete("/utilisateurs/{utilisateur_id}")
def supprimer_utilisateur(
    utilisateur_id: int,
    db: Session = Depends(get_db),
    utilisateur_actuel: Utilisateur = Depends(exiger_roles("admin"))
):
    utilisateur = (
        db.query(Utilisateur)
        .filter(Utilisateur.id == utilisateur_id)
        .first()
    )

    if not utilisateur:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if utilisateur.role == "admin":
        nombre_admins = (
            db.query(Utilisateur)
            .filter(Utilisateur.role == "admin")
            .count()
        )

        if nombre_admins <= 1:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Impossible de supprimer le dernier compte administrateur : "
                    "vous perdriez tout accès à la gestion des utilisateurs."
                )
            )

    db.delete(utilisateur)
    db.commit()

    return {"message": "Utilisateur supprimé avec succès"}