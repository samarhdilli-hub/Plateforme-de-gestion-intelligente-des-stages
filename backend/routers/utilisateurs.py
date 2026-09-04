from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Utilisateur
from schemas import UtilisateurCreate, UtilisateurResponse
from services.security import (
    password_hash,
    valider_role,
    exiger_roles,
    utilisateur_courant_optionnel,
)
from services.utilisateurs_service import (
    verifier_droit_creation,
    creer_utilisateur,
    verifier_email_disponible,
    verifier_dernier_admin_conserve,
    verifier_suppression_dernier_admin,
)

router = APIRouter(prefix="/utilisateurs", tags=["Utilisateurs"])


@router.get("", response_model=list[UtilisateurResponse])
def get_utilisateurs(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin"))
):
    return db.query(Utilisateur).all()


@router.get("/{utilisateur_id}", response_model=UtilisateurResponse)
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


@router.post("", response_model=UtilisateurResponse)
def ajouter_utilisateur(
    utilisateur: UtilisateurCreate,
    db: Session = Depends(get_db),
    utilisateur_actuel: Utilisateur | None = Depends(utilisateur_courant_optionnel)
):
    nombre_utilisateurs_existants = verifier_droit_creation(db, utilisateur_actuel)
    return creer_utilisateur(db, utilisateur, nombre_utilisateurs_existants)


@router.put("/{utilisateur_id}", response_model=UtilisateurResponse)
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

    verifier_email_disponible(db, utilisateur.email, utilisateur_id)
    valider_role(utilisateur.role)
    verifier_dernier_admin_conserve(db, ancien, utilisateur.role, utilisateur.actif)

    ancien.nom = utilisateur.nom
    ancien.prenom = utilisateur.prenom
    ancien.email = utilisateur.email

    # Un mot de passe vide signifie "ne pas le changer" (cas du formulaire
    # de modification, qui n'affiche jamais le mot de passe existant).
    if utilisateur.mot_de_passe:
        ancien.mot_de_passe = password_hash.hash(utilisateur.mot_de_passe)

    ancien.role = utilisateur.role
    ancien.actif = utilisateur.actif

    db.commit()
    db.refresh(ancien)

    return ancien


@router.delete("/{utilisateur_id}")
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

    verifier_suppression_dernier_admin(db, utilisateur)

    db.delete(utilisateur)
    db.commit()

    return {"message": "Utilisateur supprimé avec succès"}
