from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Affectation, Evaluation, Utilisateur
from schemas import EvaluationCreate, EvaluationResponse
from services.security import utilisateur_courant, exiger_roles

# Pas de préfixe unique : /evaluations et /affectations/{id}/evaluation
# vivent tous les deux ici, car ce sont les mêmes ressources (l'évaluation
# d'une affectation), sous deux façons de les consulter.
router = APIRouter(tags=["Évaluations"])


@router.get("/evaluations", response_model=list[EvaluationResponse])
def get_evaluations(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    return db.query(Evaluation).all()


@router.get("/affectations/{affectation_id}/evaluation", response_model=EvaluationResponse)
def get_evaluation_affectation(
    affectation_id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    evaluation = (
        db.query(Evaluation)
        .filter(Evaluation.affectation_id == affectation_id)
        .first()
    )

    if not evaluation:
        raise HTTPException(status_code=404, detail="Aucune évaluation pour cette affectation")

    return evaluation


@router.post("/evaluations", response_model=EvaluationResponse)
def ajouter_evaluation(
    evaluation: EvaluationCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    affectation = (
        db.query(Affectation)
        .filter(Affectation.id == evaluation.affectation_id)
        .first()
    )

    if not affectation:
        raise HTTPException(status_code=404, detail="Affectation introuvable")

    existante = (
        db.query(Evaluation)
        .filter(Evaluation.affectation_id == evaluation.affectation_id)
        .first()
    )

    if existante:
        raise HTTPException(
            status_code=400,
            detail="Cette affectation a déjà une évaluation. Modifiez-la plutôt."
        )

    nouvelle_evaluation = Evaluation(
        affectation_id=evaluation.affectation_id,
        note=evaluation.note,
        commentaire=evaluation.commentaire,
        date_evaluation=evaluation.date_evaluation or date.today(),
    )

    db.add(nouvelle_evaluation)
    db.commit()
    db.refresh(nouvelle_evaluation)

    return nouvelle_evaluation


@router.put("/evaluations/{evaluation_id}", response_model=EvaluationResponse)
def modifier_evaluation(
    evaluation_id: int,
    evaluation: EvaluationCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    ancienne = (
        db.query(Evaluation)
        .filter(Evaluation.id == evaluation_id)
        .first()
    )

    if not ancienne:
        raise HTTPException(status_code=404, detail="Évaluation introuvable")

    ancienne.note = evaluation.note
    ancienne.commentaire = evaluation.commentaire
    ancienne.date_evaluation = evaluation.date_evaluation or ancienne.date_evaluation

    db.commit()
    db.refresh(ancienne)

    return ancienne


@router.delete("/evaluations/{evaluation_id}")
def supprimer_evaluation(
    evaluation_id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    evaluation = (
        db.query(Evaluation)
        .filter(Evaluation.id == evaluation_id)
        .first()
    )

    if not evaluation:
        raise HTTPException(status_code=404, detail="Évaluation introuvable")

    db.delete(evaluation)
    db.commit()

    return {"message": "Évaluation supprimée avec succès"}
