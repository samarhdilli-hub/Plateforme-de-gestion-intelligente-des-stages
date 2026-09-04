import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from database import get_db
from models import Utilisateur


password_hash = PasswordHash.recommended()

ROLES_AUTORISES = ["admin", "encadrant", "stagiaire"]

SECRET_KEY = os.environ.get("JWT_SECRET_KEY")

if not SECRET_KEY:
    SECRET_KEY = secrets.token_hex(32)
    print(
        "⚠️  JWT_SECRET_KEY n'est pas définie dans .env : une clé "
        "temporaire aléatoire a été générée pour cette session. "
        "Tous les jetons émis seront invalidés au prochain redémarrage. "
        "Ajoutez JWT_SECRET_KEY à votre fichier .env pour une clé stable."
    )

ALGORITHM = "HS256"

DUREE_VALIDITE_TOKEN_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
oauth2_scheme_optionnel = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)


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
    """Génère un jeton JWT signé, valide pour une durée limitée."""

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
    """Décode le jeton JWT et renvoie l'utilisateur correspondant."""

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
    """Dépendance FastAPI qui vérifie que l'utilisateur connecté
    possède l'un des rôles autorisés."""

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
