from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import Stagiaire, Utilisateur
from schemas import StagiaireCreate, StagiaireResponse
from services.security import utilisateur_courant, exiger_roles

router = APIRouter(prefix="/stagiaires", tags=["Stagiaires"])


@router.get("", response_model=list[StagiaireResponse])
def get_stagiaires(
    inclure_archives: bool = False,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    requete = db.query(Stagiaire)

    if not inclure_archives:
        requete = requete.filter(Stagiaire.archive == False)  # noqa: E712

    return requete.all()


@router.get("/{stagiaire_id}", response_model=StagiaireResponse)
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


@router.post("", response_model=StagiaireResponse)
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
        niveau_etude=stagiaire.niveau_etude,
        date_debut=stagiaire.date_debut,
        date_fin=stagiaire.date_fin,
        statut=stagiaire.statut,
        date_creation=date.today(),
    )

    db.add(nouveau_stagiaire)
    db.commit()
    db.refresh(nouveau_stagiaire)

    return nouveau_stagiaire


@router.put("/{stagiaire_id}", response_model=StagiaireResponse)
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
    ancien.niveau_etude = stagiaire.niveau_etude
    ancien.date_debut = stagiaire.date_debut
    ancien.date_fin = stagiaire.date_fin
    ancien.statut = stagiaire.statut

    db.commit()
    db.refresh(ancien)

    return ancien


@router.put("/{stagiaire_id}/archiver", response_model=StagiaireResponse)
def archiver_stagiaire(
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

    stagiaire.archive = True

    db.commit()
    db.refresh(stagiaire)

    return stagiaire


@router.put("/{stagiaire_id}/reactiver", response_model=StagiaireResponse)
def reactiver_stagiaire(
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

    stagiaire.archive = False

    db.commit()
    db.refresh(stagiaire)

    return stagiaire


@router.delete("/{stagiaire_id}")
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

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "Ce stagiaire a des affectations (et éventuellement des "
                "évaluations) liées : impossible de le supprimer. "
                "Archivez-le plutôt via /stagiaires/{id}/archiver."
            )
        )

    return {"message": "Stagiaire supprimé avec succès"}
