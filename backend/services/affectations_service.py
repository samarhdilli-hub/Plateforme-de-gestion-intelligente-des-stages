from sqlalchemy.orm import Session

from models import SujetStage


def marquer_sujet_attribue(db: Session, sujet_id: int):
    sujet = db.query(SujetStage).filter(SujetStage.id == sujet_id).first()
    if sujet:
        sujet.statut = "Attribué"


def liberer_sujet(db: Session, sujet_id: int):
    sujet = db.query(SujetStage).filter(SujetStage.id == sujet_id).first()
    if sujet:
        sujet.statut = "Disponible"


def synchroniser_statut_sujet_sur_modification(
    db: Session,
    ancien_sujet_id: int,
    nouveau_sujet_id: int,
    etait_active: bool,
    devient_active: bool,
):
    """Après modification d'une affectation, remet à jour le(s) sujet(s)
    concerné(s) pour que leur statut reflète toujours la réalité :
    - si le sujet a changé et que l'ancienne affectation était active,
      l'ancien sujet redevient disponible ;
    - le nouveau sujet passe à "Attribué" si l'affectation est active,
      ou repasse à "Disponible" si elle ne l'est plus (et qu'il s'agit
      du même sujet qu'avant)."""

    if ancien_sujet_id != nouveau_sujet_id and etait_active:
        liberer_sujet(db, ancien_sujet_id)

    if devient_active:
        marquer_sujet_attribue(db, nouveau_sujet_id)
    elif etait_active and ancien_sujet_id == nouveau_sujet_id:
        liberer_sujet(db, nouveau_sujet_id)
