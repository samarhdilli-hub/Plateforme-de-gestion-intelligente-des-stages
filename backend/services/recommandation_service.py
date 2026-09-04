from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import Stagiaire, SujetStage


TECHNOLOGIES_CONNUES = [
    "python", "java", "javascript", "react", "fastapi",
    "postgresql", "sql", "html", "css", "c++", "c",
    "php", "angular", "vue", "node",
]


def calculer_recommandations(db: Session, stagiaire_id: int) -> dict:
    """Calcule, pour un stagiaire donné, le sujet disponible le plus
    pertinent au vu de sa spécialité et de son niveau d'étude, ainsi que
    quelques alternatives."""

    stagiaire = (
        db.query(Stagiaire)
        .filter(Stagiaire.id == stagiaire_id)
        .first()
    )

    if not stagiaire:
        raise HTTPException(status_code=404, detail="Stagiaire introuvable")

    tous_les_sujets = db.query(SujetStage).all()

    sujets_disponibles = [
        sujet for sujet in tous_les_sujets
        if (sujet.statut or "").strip().lower() == "disponible"
    ]

    if not sujets_disponibles:
        raise HTTPException(
            status_code=404,
            detail="Aucun sujet disponible"
        )

    specialite = (stagiaire.specialite or "").strip().lower()

    recommandations = []

    for sujet in sujets_disponibles:

        score = 0
        raisons = []

        titre = (sujet.titre or "").strip().lower()
        description = (sujet.description or "").strip().lower()
        entreprise = (sujet.entreprise or "").strip().lower()
        technologies = (sujet.technologies or "").strip().lower()

        texte_complet = " ".join(
            [titre, description, entreprise, technologies]
        )

        if specialite:
            mots_specialite = specialite.split()

            mots_trouves = [
                mot for mot in mots_specialite
                if len(mot) >= 3 and mot in texte_complet
            ]

            if mots_trouves:
                score += len(mots_trouves) * 20
                raisons.append(
                    "La spécialité du stagiaire correspond au sujet."
                )

        technologies_trouvees = [
            technologie for technologie in TECHNOLOGIES_CONNUES
            if technologie in specialite and technologie in texte_complet
        ]

        if technologies_trouvees:
            score += len(technologies_trouvees) * 15
            raisons.append(
                "Les technologies du sujet correspondent au profil."
            )

        if description:
            score += 5
            raisons.append("Le sujet possède une description.")

        if technologies:
            score += 5

        if stagiaire.niveau_etude and sujet.niveau_requis:
            if stagiaire.niveau_etude.strip().lower() == sujet.niveau_requis.strip().lower():
                score += 10
                raisons.append("Le niveau d'étude correspond au niveau requis.")

        recommandations.append({
            "sujet": sujet,
            "score": score,
            "raisons": raisons,
        })

    recommandations.sort(key=lambda x: x["score"], reverse=True)

    meilleur = recommandations[0]
    sujet = meilleur["sujet"]
    raisons = meilleur["raisons"] or [
        "Sujet disponible.",
        "Le sujet peut être étudié pour ce profil.",
    ]

    return {
        "stagiaire": {
            "id": stagiaire.id,
            "nom": stagiaire.nom,
            "prenom": stagiaire.prenom,
            "specialite": stagiaire.specialite,
            "niveau_etude": stagiaire.niveau_etude,
        },

        "sujet_recommande": {
            "id": sujet.id,
            "titre": sujet.titre,
            "description": sujet.description,
            "entreprise": sujet.entreprise,
            "technologies": sujet.technologies,
            "duree": sujet.duree,
            "localisation": sujet.localisation,
            "niveau_requis": sujet.niveau_requis,
            "statut": sujet.statut,
        },

        "score": min(meilleur["score"], 100),
        "raisons": raisons,

        "autres_sujets": [
            {
                "id": element["sujet"].id,
                "titre": element["sujet"].titre,
                "entreprise": element["sujet"].entreprise,
                "technologies": element["sujet"].technologies,
                "localisation": element["sujet"].localisation,
                "score": min(element["score"], 100),
            }
            for element in recommandations[1:4]
        ],
    }
