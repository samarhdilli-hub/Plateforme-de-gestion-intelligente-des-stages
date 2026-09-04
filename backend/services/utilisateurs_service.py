from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import Utilisateur
from services.security import password_hash, valider_role


def verifier_droit_creation(db: Session, utilisateur_actuel: Utilisateur | None):
    """Seul un admin peut créer un compte, sauf si la base est vide : dans
    ce cas la création est libre, pour permettre de créer le tout premier
    compte admin."""

    nombre_utilisateurs_existants = db.query(Utilisateur).count()

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

    return nombre_utilisateurs_existants


def creer_utilisateur(db: Session, donnees, nombre_utilisateurs_existants: int) -> Utilisateur:
    ancien = (
        db.query(Utilisateur)
        .filter(Utilisateur.email == donnees.email)
        .first()
    )

    if ancien:
        raise HTTPException(
            status_code=400,
            detail="Un utilisateur avec cet email existe déjà"
        )

    valider_role(donnees.role)

    # Le tout premier compte créé devient automatiquement admin.
    role_final = (
        "admin" if nombre_utilisateurs_existants == 0 else donnees.role
    )

    nouvel_utilisateur = Utilisateur(
        nom=donnees.nom,
        prenom=donnees.prenom,
        email=donnees.email,
        mot_de_passe=password_hash.hash(donnees.mot_de_passe),
        role=role_final,
        actif=donnees.actif,
    )

    db.add(nouvel_utilisateur)
    db.commit()
    db.refresh(nouvel_utilisateur)

    return nouvel_utilisateur


def verifier_email_disponible(db: Session, email: str, utilisateur_id: int):
    email_existant = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.email == email,
            Utilisateur.id != utilisateur_id
        )
        .first()
    )

    if email_existant:
        raise HTTPException(
            status_code=400,
            detail="Cet email est déjà utilisé"
        )


def verifier_dernier_admin_conserve(db: Session, ancien: Utilisateur, nouveau_role: str, nouveau_actif: bool):
    """Empêche de retirer le rôle admin ou de désactiver le dernier
    administrateur restant : il faut toujours pouvoir gérer les comptes."""

    devient_non_admin = ancien.role == "admin" and (
        nouveau_role != "admin" or not nouveau_actif
    )

    if not devient_non_admin:
        return

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


def verifier_suppression_dernier_admin(db: Session, utilisateur: Utilisateur):
    if utilisateur.role != "admin":
        return

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
