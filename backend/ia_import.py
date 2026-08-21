
import re
from difflib import SequenceMatcher
from io import BytesIO

from openpyxl import load_workbook
from docx import Document
from pypdf import PdfReader


# =========================================================
# LABELS RECONNUS DANS LES DOCUMENTS
# =========================================================

LABELS = {
    "titre": ["titre", "title", "sujet", "intitulé", "intitule"],
    "description": ["description", "résumé", "resume", "détails", "details", "mission"],
    "entreprise": ["entreprise", "société", "societe", "company", "organisme"],
    "technologies": ["technologies", "compétences", "competences", "stack", "outils"],
    "duree": ["durée", "duree", "duration"],
    "domaine": ["domaine", "département", "departement", "catégorie", "categorie"],
}


def _normaliser(texte: str) -> str:
    return re.sub(r"\s+", " ", (texte or "")).strip()


def _detecter_label(ligne: str):
    """Si la ligne suit le format 'Label : valeur', renvoie (champ, valeur)."""

    match = re.match(r"^\s*[-*•]?\s*([A-Za-zÀ-ÿ ]{2,25})\s*[:\-]\s*(.+)$", ligne)

    if not match:
        return None

    cle_brute = match.group(1).strip().lower()
    valeur = match.group(2).strip()

    for champ, alias_list in LABELS.items():
        if cle_brute in alias_list:
            return champ, valeur

    return None


# =========================================================
# DÉCOUPAGE DU TEXTE EN BLOCS (1 bloc = 1 sujet potentiel)
# =========================================================

def _decouper_en_blocs(lignes: list) -> list:
    """Regroupe les lignes en blocs, séparés par une ligne vide ou par
    l'apparition d'un nouveau label 'Titre :' (utile pour les PDF compacts
    sans lignes vides entre les sujets)."""

    blocs = []
    bloc_courant = []

    for ligne in lignes:
        ligne_nettoyee = ligne.strip()

        if not ligne_nettoyee:
            if bloc_courant:
                blocs.append(bloc_courant)
                bloc_courant = []
            continue

        detection = _detecter_label(ligne_nettoyee)

        if detection and detection[0] == "titre" and bloc_courant:
            blocs.append(bloc_courant)
            bloc_courant = []

        bloc_courant.append(ligne_nettoyee)

    if bloc_courant:
        blocs.append(bloc_courant)

    return blocs


def _extraire_sujet_depuis_bloc(lignes_bloc: list) -> dict:
    sujet = {
        "titre": "",
        "description": "",
        "entreprise": None,
        "technologies": None,
        "duree": None,
        "domaine_indique": None,
    }

    lignes_libres = []

    for ligne in lignes_bloc:
        detection = _detecter_label(ligne)

        if detection:
            champ, valeur = detection

            if champ == "domaine":
                sujet["domaine_indique"] = valeur
            elif sujet.get(champ):
                sujet[champ] += " " + valeur
            else:
                sujet[champ] = valeur

            continue

        lignes_libres.append(ligne)

    if not sujet["titre"]:
        # Pas de label "Titre :" trouvé : on prend la première ligne du bloc
        # en retirant une éventuelle numérotation ("1.", "1)", "- ", "•").
        premiere = lignes_libres.pop(0) if lignes_libres else "Sujet sans titre"
        sujet["titre"] = re.sub(r"^\s*(\d+[\.\)]|[-*•])\s*", "", premiere).strip()

    if lignes_libres:
        reste = " ".join(lignes_libres)
        sujet["description"] = (
            (sujet["description"] + " " + reste).strip()
            if sujet["description"] else reste
        )

    for champ in ["titre", "description", "entreprise", "technologies", "duree"]:
        if sujet.get(champ):
            sujet[champ] = _normaliser(sujet[champ])

    return sujet


def extraire_sujets_depuis_texte(texte: str) -> list:
    lignes = texte.splitlines()
    blocs = _decouper_en_blocs(lignes)

    sujets = [_extraire_sujet_depuis_bloc(bloc) for bloc in blocs]

    # On ignore les blocs trop courts pour être un vrai sujet
    # (en-têtes de page, mentions légales isolées, etc.).
    return [s for s in sujets if s["titre"] and len(s["titre"]) > 3]


# =========================================================
# LECTURE DES FICHIERS PAR FORMAT
# =========================================================

def lire_pdf(contenu: bytes) -> list:
    lecteur = PdfReader(BytesIO(contenu))
    texte_total = "\n".join(page.extract_text() or "" for page in lecteur.pages)
    return extraire_sujets_depuis_texte(texte_total)


def lire_docx(contenu: bytes) -> list:
    document = Document(BytesIO(contenu))
    lignes = [paragraphe.text for paragraphe in document.paragraphs]
    return extraire_sujets_depuis_texte("\n".join(lignes))


def lire_excel(contenu: bytes) -> list:
    """Lit un fichier Excel où chaque ligne représente un sujet, avec des
    colonnes reconnues par leur en-tête (titre, description, entreprise,
    technologies, durée — insensible à la casse)."""

    classeur = load_workbook(BytesIO(contenu), data_only=True)
    feuille = classeur.active

    lignes = list(feuille.iter_rows(values_only=True))
    if not lignes:
        return []

    entetes = [str(cellule).strip().lower() if cellule else "" for cellule in lignes[0]]

    correspondance = {}
    for index, entete in enumerate(entetes):
        for champ, alias_list in LABELS.items():
            if entete in alias_list:
                correspondance[champ] = index
                break

    sujets = []

    for ligne in lignes[1:]:
        if not any(ligne):
            continue

        def valeur(champ, ligne=ligne):
            index = correspondance.get(champ)
            if index is None or index >= len(ligne):
                return None
            cellule = ligne[index]
            return str(cellule).strip() if cellule is not None else None

        titre = valeur("titre")
        if not titre:
            continue

        sujets.append({
            "titre": titre,
            "description": valeur("description") or "",
            "entreprise": valeur("entreprise"),
            "technologies": valeur("technologies"),
            "duree": valeur("duree"),
            "domaine_indique": valeur("domaine"),
        })

    return sujets


def lire_fichier(nom_fichier: str, contenu: bytes) -> list:
    extension = nom_fichier.lower().rsplit(".", 1)[-1] if "." in nom_fichier else ""

    if extension == "pdf":
        return lire_pdf(contenu)
    if extension == "docx":
        return lire_docx(contenu)
    if extension in ("xlsx", "xls"):
        return lire_excel(contenu)

    raise ValueError(
        "Format de fichier non pris en charge. "
        "Formats acceptés : PDF (.pdf), Word (.docx), Excel (.xlsx)."
    )


# =========================================================
# CATÉGORISATION AUTOMATIQUE PAR DOMAINE
# =========================================================

CATEGORIES = {
    "Développement Web": [
        "web", "react", "angular", "vue", "html", "css", "javascript",
        "frontend", "front-end", "backend", "back-end", "fullstack",
        "django", "fastapi", "node", "php", "laravel",
    ],
    "Data / Intelligence Artificielle": [
        "data", "données", "donnees", "ia", "intelligence artificielle",
        "machine learning", "deep learning", "nlp", "spacy", "transformers",
        "tensorflow", "pytorch", "data science", "big data", "analytics",
    ],
    "Mobile": [
        "mobile", "android", "ios", "flutter", "react native", "swift", "kotlin",
    ],
    "Réseaux & Systèmes": [
        "réseau", "reseau", "systèmes", "systemes", "cisco", "linux",
        "administration système", "infrastructure", "cloud", "devops",
        "docker", "kubernetes",
    ],
    "Cybersécurité": [
        "sécurité", "securite", "cybersécurité", "cybersecurite", "pentest",
        "firewall", "cryptographie",
    ],
}


def categoriser_sujet(sujet: dict) -> str:
    texte = " ".join([
        sujet.get("titre") or "",
        sujet.get("description") or "",
        sujet.get("technologies") or "",
        sujet.get("domaine_indique") or "",
    ]).lower()

    meilleure_categorie = "Autre"
    meilleur_score = 0

    for categorie, mots_cles in CATEGORIES.items():
        score = sum(1 for mot in mots_cles if mot in texte)
        if score > meilleur_score:
            meilleur_score = score
            meilleure_categorie = categorie

    return meilleure_categorie


# =========================================================
# DÉTECTION DE DOUBLONS
# =========================================================

def detecter_doublon(titre_nouveau: str, sujets_existants: list, seuil: float = 0.80):
    """Compare le titre d'un sujet importé à ceux déjà en base et renvoie
    le sujet existant le plus proche si la similarité dépasse le seuil."""

    titre_normalise = _normaliser(titre_nouveau).lower()
    meilleur = None
    meilleur_score = 0.0

    for sujet_existant in sujets_existants:
        titre_existant = _normaliser(sujet_existant.titre or "").lower()
        score = SequenceMatcher(None, titre_normalise, titre_existant).ratio()

        if score > meilleur_score:
            meilleur_score = score
            meilleur = sujet_existant

    if meilleur and meilleur_score >= seuil:
        return meilleur, round(meilleur_score * 100)

    return None, 0