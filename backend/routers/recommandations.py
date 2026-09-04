from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Utilisateur
from services.recommandation_service import calculer_recommandations
from services.security import utilisateur_courant

router = APIRouter(tags=["Recommandation intelligente"])


@router.post("/recommander-sujet/{stagiaire_id}")
def recommander_sujet(
    stagiaire_id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    return calculer_recommandations(db, stagiaire_id)
