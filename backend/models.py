from datetime import date

from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from database import Base


# TABLE STAGIAIRES

class Stagiaire(Base):
    __tablename__ = "stagiaires"

    id = Column(Integer, primary_key=True, index=True)

    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)

    date_naissance = Column(Date, nullable=True)

    email = Column(String(150), nullable=False, unique=True)

    telephone = Column(String(20), nullable=True)

    universite = Column(String(150), nullable=True)

    specialite = Column(String(150), nullable=True)

    niveau_etude = Column(String(100), nullable=True)

    date_debut = Column(Date, nullable=True)
    date_fin = Column(Date, nullable=True)

    statut = Column(String(50), nullable=True)

    archive = Column(Boolean, nullable=False, default=False)

    date_creation = Column(Date, nullable=False, default=date.today)


# TABLE SUJETS DE STAGE

class SujetStage(Base):
    __tablename__ = "sujets"

    id = Column(Integer, primary_key=True, index=True)

    titre = Column(String(200), nullable=False)

    description = Column(String(1000), nullable=True)

    entreprise = Column(String(150), nullable=True)

    technologies = Column(String(300), nullable=True)

    duree = Column(String(100), nullable=True)

    localisation = Column(String(150), nullable=True)

    niveau_requis = Column(String(100), nullable=True)

    statut = Column(String(50), nullable=True)

    categorie = Column(String(100), nullable=True)

    date_creation = Column(Date, nullable=False, default=date.today)


# TABLE AFFECTATIONS

class Affectation(Base):
    __tablename__ = "affectations"

    id = Column(Integer, primary_key=True, index=True)

    stagiaire_id = Column(
        Integer,
        ForeignKey("stagiaires.id"),
        nullable=False
    )

    sujet_id = Column(
        Integer,
        ForeignKey("sujets.id"),
        nullable=False
    )

    date_affectation = Column(
        Date,
        nullable=True
    )

    statut = Column(
        String(50),
        nullable=True,
        default="Affecté"
    )

    stagiaire = relationship(
        "Stagiaire",
        backref="affectations"
    )

    sujet = relationship(
        "SujetStage",
        backref="affectations"
    )

    evaluation = relationship(
        "Evaluation",
        backref="affectation",
        uselist=False,
        cascade="all, delete-orphan"
    )


# TABLE EVALUATIONS

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)

    affectation_id = Column(
        Integer,
        ForeignKey("affectations.id"),
        nullable=False,
        unique=True
    )

    note = Column(Integer, nullable=False)

    commentaire = Column(Text, nullable=True)

    date_evaluation = Column(Date, nullable=False, default=date.today)


# TABLE UTILISATEURS

class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nom = Column(
        String(100),
        nullable=False
    )

    prenom = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        nullable=False,
        unique=True
    )

    mot_de_passe = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(50),
        nullable=False,
        default="stagiaire"
    )

    actif = Column(
        Boolean,
        nullable=False,
        default=True
    )
