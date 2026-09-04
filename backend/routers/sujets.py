from datetime import date

import requests
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import ia_import
from database import get_db
from models import SujetStage, Utilisateur
from schemas import (
    ImportUrlRequest,
    ResultatImportSujets,
    SujetCreate,
    SujetResponse,
)
from services.security import utilisateur_courant, exiger_roles
from services.sujets_service import construire_apercu, marquer_obsolescence

router = APIRouter(prefix="/sujets", tags=["Sujets de stage"])


@router.get("", response_model=list[SujetResponse])
def get_sujets(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    return marquer_obsolescence(db.query(SujetStage).all())


@router.get("/obsoletes", response_model=list[SujetResponse])
def get_sujets_obsoletes(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    """Sujets toujours "Disponible" depuis plus de 90 jours : probablement
    obsolètes, à revoir ou à retirer."""

    disponibles = (
        db.query(SujetStage)
        .filter(SujetStage.statut == "Disponible")
        .all()
    )

    obsoletes = [s for s in disponibles if ia_import.est_obsolete(s)]

    return marquer_obsolescence(obsoletes)


@router.get("/{sujet_id}", response_model=SujetResponse)
def get_sujet(
    sujet_id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(utilisateur_courant)
):
    sujet = (
        db.query(SujetStage)
        .filter(SujetStage.id == sujet_id)
        .first()
    )

    if not sujet:
        raise HTTPException(status_code=404, detail="Sujet introuvable")

    return marquer_obsolescence(sujet)


@router.post("", response_model=SujetResponse)
def ajouter_sujet(
    sujet: SujetCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    nouveau_sujet = SujetStage(
        titre=sujet.titre,
        description=sujet.description,
        entreprise=sujet.entreprise,
        technologies=sujet.technologies,
        duree=sujet.duree,
        localisation=sujet.localisation,
        niveau_requis=sujet.niveau_requis,
        statut=sujet.statut,
        categorie=sujet.categorie,
        date_creation=date.today(),
    )

    db.add(nouveau_sujet)
    db.commit()
    db.refresh(nouveau_sujet)

    return marquer_obsolescence(nouveau_sujet)


@router.put("/{sujet_id}", response_model=SujetResponse)
def modifier_sujet(
    sujet_id: int,
    sujet: SujetCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    ancien = (
        db.query(SujetStage)
        .filter(SujetStage.id == sujet_id)
        .first()
    )

    if not ancien:
        raise HTTPException(status_code=404, detail="Sujet introuvable")

    ancien.titre = sujet.titre
    ancien.description = sujet.description
    ancien.entreprise = sujet.entreprise
    ancien.technologies = sujet.technologies
    ancien.duree = sujet.duree
    ancien.localisation = sujet.localisation
    ancien.niveau_requis = sujet.niveau_requis
    ancien.statut = sujet.statut
    ancien.categorie = sujet.categorie

    db.commit()
    db.refresh(ancien)

    return marquer_obsolescence(ancien)


@router.delete("/{sujet_id}")
def supprimer_sujet(
    sujet_id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    sujet = (
        db.query(SujetStage)
        .filter(SujetStage.id == sujet_id)
        .first()
    )

    if not sujet:
        raise HTTPException(status_code=404, detail="Sujet introuvable")

    db.delete(sujet)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Ce sujet est lié à une ou plusieurs affectations : impossible de le supprimer."
        )

    return {"message": "Sujet supprimé avec succès"}


# IMPORT INTELLIGENT DE SUJETS (PDF / Word / Excel / CSV / JSON / URL)
# /sujets/importer et /sujets/importer-url renvoient un aperçu des sujets
# détectés sans rien enregistrer ; /sujets/importer/confirmer enregistre
# la sélection retenue par l'utilisateur.

@router.post("/importer", response_model=ResultatImportSujets)
async def importer_sujets(
    fichier: UploadFile = File(...),
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    contenu = await fichier.read()

    try:
        sujets_bruts = ia_import.lire_fichier(fichier.filename or "", contenu)
    except ValueError as erreur:
        raise HTTPException(status_code=400, detail=str(erreur))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Impossible de lire ce fichier. Vérifiez qu'il n'est pas corrompu."
        )

    return construire_apercu(sujets_bruts, db)


@router.post("/importer-url", response_model=ResultatImportSujets)
def importer_sujets_url(
    requete: ImportUrlRequest,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    """Importe des sujets depuis une source externe (export CSV/Excel/JSON
    exposé par une base de données ou un système RH tiers)."""

    try:
        reponse = requests.get(requete.url, timeout=15)
        reponse.raise_for_status()
    except requests.RequestException:
        raise HTTPException(
            status_code=400,
            detail="Impossible de récupérer le contenu à cette URL."
        )

    nom_fichier = requete.url.rsplit("/", 1)[-1] or "import"
    if "." not in nom_fichier:
        type_contenu = reponse.headers.get("content-type", "")
        if "json" in type_contenu:
            nom_fichier += ".json"
        elif "csv" in type_contenu:
            nom_fichier += ".csv"
        elif "spreadsheet" in type_contenu or "excel" in type_contenu:
            nom_fichier += ".xlsx"

    try:
        sujets_bruts = ia_import.lire_fichier(nom_fichier, reponse.content)
    except ValueError as erreur:
        raise HTTPException(status_code=400, detail=str(erreur))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Impossible d'interpréter le contenu récupéré (format non reconnu)."
        )

    return construire_apercu(sujets_bruts, db)


@router.post("/importer/confirmer", response_model=list[SujetResponse])
def confirmer_import_sujets(
    sujets: list[SujetCreate],
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_roles("admin", "encadrant"))
):
    if not sujets:
        raise HTTPException(
            status_code=400,
            detail="Aucun sujet à importer."
        )

    nouveaux_sujets = []

    for sujet in sujets:
        nouveau_sujet = SujetStage(
            titre=sujet.titre,
            description=sujet.description,
            entreprise=sujet.entreprise,
            technologies=sujet.technologies,
            duree=sujet.duree,
            localisation=sujet.localisation,
            niveau_requis=sujet.niveau_requis,
            statut=sujet.statut or "Disponible",
            categorie=sujet.categorie,
            date_creation=date.today(),
        )
        db.add(nouveau_sujet)
        nouveaux_sujets.append(nouveau_sujet)

    db.commit()

    for sujet in nouveaux_sujets:
        db.refresh(sujet)

    return marquer_obsolescence(nouveaux_sujets)
