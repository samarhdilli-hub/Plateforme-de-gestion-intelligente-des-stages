from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional


# =========================================================
# STAGIAIRE
# =========================================================

class StagiaireCreate(BaseModel):
    nom: str
    prenom: str
    date_naissance: Optional[date] = None
    email: str
    telephone: Optional[str] = None
    universite: Optional[str] = None
    specialite: Optional[str] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    statut: Optional[str] = "En cours"


class StagiaireResponse(BaseModel):
    id: int
    nom: str
    prenom: str
    date_naissance: Optional[date] = None
    email: str
    telephone: Optional[str] = None
    universite: Optional[str] = None
    specialite: Optional[str] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    statut: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# SUJET DE STAGE
# =========================================================

class SujetCreate(BaseModel):
    titre: str
    description: Optional[str] = None
    entreprise: Optional[str] = None
    technologies: Optional[str] = None
    duree: Optional[str] = None
    statut: Optional[str] = "Disponible"
    categorie: Optional[str] = None


class SujetResponse(BaseModel):
    id: int
    titre: str
    description: Optional[str] = None
    entreprise: Optional[str] = None
    technologies: Optional[str] = None
    duree: Optional[str] = None
    statut: Optional[str] = None
    categorie: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# IMPORT INTELLIGENT DE SUJETS (PDF / Word / Excel)
# =========================================================

class DoublonProbable(BaseModel):
    id: int
    titre: str
    similarite: int


class SujetExtrait(BaseModel):
    titre: str
    description: Optional[str] = None
    entreprise: Optional[str] = None
    technologies: Optional[str] = None
    duree: Optional[str] = None
    statut: Optional[str] = "Disponible"
    categorie: Optional[str] = None
    doublon_probable: Optional[DoublonProbable] = None


class ResultatImportSujets(BaseModel):
    nombre_extrait: int
    nombre_doublons_potentiels: int
    sujets_extraits: list[SujetExtrait]


# =========================================================
# AFFECTATION
# =========================================================

class AffectationCreate(BaseModel):
    stagiaire_id: int
    sujet_id: int
    date_affectation: Optional[date] = None
    statut: Optional[str] = "Active"


class AffectationResponse(BaseModel):
    id: int
    stagiaire_id: int
    sujet_id: int
    date_affectation: Optional[date] = None
    statut: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# UTILISATEUR
# =========================================================

class UtilisateurCreate(BaseModel):
    nom: str
    prenom: str
    email: str
    mot_de_passe: str
    role: Optional[str] = "stagiaire"
    actif: Optional[bool] = True


class UtilisateurResponse(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    role: str
    actif: bool

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# AUTHENTIFICATION
# =========================================================

class LoginRequest(BaseModel):
    email: str
    mot_de_passe: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str