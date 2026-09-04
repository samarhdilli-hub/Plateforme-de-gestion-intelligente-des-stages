from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Utilisateur
from schemas import LoginRequest, Token, UtilisateurResponse
from services.security import (
    password_hash,
    creer_token_acces,
    utilisateur_courant,
)

router = APIRouter(tags=["Authentification"])


@router.post("/login", response_model=Token)
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


@router.get("/moi", response_model=UtilisateurResponse)
def get_utilisateur_courant(
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    """Renvoie le profil de l'utilisateur actuellement connecté."""

    return utilisateur
