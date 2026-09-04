from fastapi import HTTPException
from sqlalchemy.orm import Session

import ia_import
from models import SujetStage


def marquer_obsolescence(sujets):
    """Injecte l'attribut `obsolete` (non stocké en base, calculé à la
    volée) sur un sujet ou une liste de sujets, pour la réponse API."""

    liste = sujets if isinstance(sujets, list) else [sujets]
    for sujet in liste:
        sujet.obsolete = ia_import.est_obsolete(sujet)
    return sujets


def construire_apercu(sujets_bruts: list, db: Session) -> dict:
    """À partir de sujets bruts extraits d'un fichier/URL, calcule la
    catégorie et détecte les doublons probables, sans rien enregistrer."""

    if not sujets_bruts:
        raise HTTPException(
            status_code=422,
            detail="Aucun sujet n'a pu être extrait."
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
            "localisation": sujet_brut.get("localisation"),
            "niveau_requis": sujet_brut.get("niveau_requis"),
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
