from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Affectation, Stagiaire, SujetStage, Utilisateur
from schemas import AffectationCreate, AffectationResponse
from services.affectations_service import (
    marquer_sujet_attribue,
    liberer_sujet,
    synchroniser_statut_sujet_sur_modification,
)
from services.security import utilisateur_courant, exiger_roles

router = APIRouter(prefix="/affectations", tags=["Affectations"])


@router.get("", response_model=list[AffectationResponse])
def get_affectations(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    return db.query(Affectation).all()


@router.post("", response_model=AffectationResponse)
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

    marquer_sujet_attribue(db, affectation.sujet_id)

    db.commit()
    db.refresh(nouvelle_affectation)

    return nouvelle_affectation


@router.put("/{affectation_id}", response_model=AffectationResponse)
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

    ancien_sujet_id = ancienne.sujet_id
    etait_active = (ancienne.statut or "").strip().lower() == "active"

    ancienne.stagiaire_id = affectation.stagiaire_id
    ancienne.sujet_id = affectation.sujet_id
    ancienne.date_affectation = affectation.date_affectation
    ancienne.statut = affectation.statut

    devient_active = (affectation.statut or "").strip().lower() == "active"

    synchroniser_statut_sujet_sur_modification(
        db,
        ancien_sujet_id=ancien_sujet_id,
        nouveau_sujet_id=affectation.sujet_id,
        etait_active=etait_active,
        devient_active=devient_active,
    )

    db.commit()
    db.refresh(ancienne)

    return ancienne


@router.delete("/{affectation_id}")
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

    if (affectation.statut or "").strip().lower() == "active":
        liberer_sujet(db, affectation.sujet_id)

    db.delete(affectation)
    db.commit()

    return {"message": "Affectation supprimée avec succès"}
