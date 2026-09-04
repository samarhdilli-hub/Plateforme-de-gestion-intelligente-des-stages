import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { sujetVide } from "../utils/formDefaults";

export function useSujets(token) {
  const [sujets, setSujets] = useState([]);
  const [sujetEnModification, setSujetEnModification] = useState(null);
  const [afficherFormulaireSujet, setAfficherFormulaireSujet] = useState(false);
  const [sujetFormulaire, setSujetFormulaire] = useState(sujetVide);

  // --- Recherche intelligente des sujets ---
  const [rechercheSujets, setRechercheSujets] = useState("");
  const [filtreCategorieSujet, setFiltreCategorieSujet] = useState("");
  const [filtreStatutSujet, setFiltreStatutSujet] = useState("");
  const [filtreDureeSujet, setFiltreDureeSujet] = useState("");
  const [filtreLocalisationSujet, setFiltreLocalisationSujet] = useState("");
  const [filtreNiveauSujet, setFiltreNiveauSujet] = useState("");

  const chargerSujets = async () => {
    try {
      const response = await apiFetch("/sujets");

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des sujets");
      }

      const data = await response.json();
      setSujets(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) {
      chargerSujets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const ajouterSujet = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch("/sujets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sujetFormulaire),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout du sujet");
      }

      const nouveauSujet = await response.json();

      setSujets((anciens) => [...anciens, nouveauSujet]);
      setSujetFormulaire(sujetVide);
      setAfficherFormulaireSujet(false);

      alert("Sujet ajouté avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'ajout du sujet");
    }
  };

  const modifierSujet = (sujet) => {
    setSujetEnModification({ ...sujet });
    setAfficherFormulaireSujet(true);
  };

  const handleModificationSujetChange = (e) => {
    setSujetEnModification({
      ...sujetEnModification,
      [e.target.name]: e.target.value,
    });
  };

  const enregistrerModificationSujet = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch(
        `/sujets/${sujetEnModification.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sujetEnModification),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la modification du sujet");
      }

      const sujetModifie = await response.json();

      setSujets((anciens) =>
        anciens.map((sujet) =>
          sujet.id === sujetModifie.id ? sujetModifie : sujet
        )
      );

      setSujetEnModification(null);
      setAfficherFormulaireSujet(false);

      alert("Sujet modifié avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la modification du sujet");
    }
  };

  const supprimerSujet = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce sujet ?")) {
      return;
    }

    try {
      const response = await apiFetch(`/sujets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const erreur = await response.json().catch(() => null);
        throw new Error(erreur?.detail || "Erreur lors de la suppression du sujet");
      }

      setSujets((anciens) => anciens.filter((sujet) => sujet.id !== id));
      alert("Sujet supprimé avec succès !");
    } catch (error) {
      console.error(error);
      alert(error.message || "Erreur lors de la suppression du sujet");
    }
  };

  const annulerFormulaireSujet = () => {
    setAfficherFormulaireSujet(false);
    setSujetEnModification(null);
    setSujetFormulaire(sujetVide);
  };

  // --- Filtres / recherche ---

  const categoriesDisponibles = [...new Set(
    sujets.map((sujet) => sujet.categorie).filter(Boolean)
  )].sort();

  const dureesDisponibles = [...new Set(
    sujets.map((sujet) => sujet.duree).filter(Boolean)
  )].sort();

  const localisationsDisponibles = [...new Set(
    sujets.map((sujet) => sujet.localisation).filter(Boolean)
  )].sort();

  const niveauxDisponibles = [...new Set(
    sujets.map((sujet) => sujet.niveau_requis).filter(Boolean)
  )].sort();

  const scorePertinenceSujet = (sujet, texte) => {
    const t = texte.trim().toLowerCase();
    if (!t) return 0;

    let score = 0;
    if ((sujet.titre || "").toLowerCase().includes(t)) score += 4;
    if ((sujet.technologies || "").toLowerCase().includes(t)) score += 2;
    if ((sujet.entreprise || "").toLowerCase().includes(t)) score += 2;
    if ((sujet.categorie || "").toLowerCase().includes(t)) score += 2;
    if ((sujet.localisation || "").toLowerCase().includes(t)) score += 2;
    if ((sujet.description || "").toLowerCase().includes(t)) score += 1;
    return score;
  };

  const sujetsFiltres = sujets
    .filter((sujet) => {
      const texte = rechercheSujets.trim().toLowerCase();

      const correspondTexte =
        !texte ||
        [sujet.titre, sujet.description, sujet.entreprise, sujet.technologies, sujet.categorie, sujet.localisation]
          .some((champ) => (champ || "").toLowerCase().includes(texte));

      const correspondCategorie =
        !filtreCategorieSujet || sujet.categorie === filtreCategorieSujet;

      const correspondStatut =
        !filtreStatutSujet || sujet.statut === filtreStatutSujet;

      const correspondDuree =
        !filtreDureeSujet || sujet.duree === filtreDureeSujet;

      const correspondLocalisation =
        !filtreLocalisationSujet || sujet.localisation === filtreLocalisationSujet;

      const correspondNiveau =
        !filtreNiveauSujet || sujet.niveau_requis === filtreNiveauSujet;

      return (
        correspondTexte &&
        correspondCategorie &&
        correspondStatut &&
        correspondDuree &&
        correspondLocalisation &&
        correspondNiveau
      );
    })
    .sort(
      (a, b) =>
        scorePertinenceSujet(b, rechercheSujets) - scorePertinenceSujet(a, rechercheSujets)
    );

  const reinitialiserFiltresSujets = () => {
    setRechercheSujets("");
    setFiltreCategorieSujet("");
    setFiltreStatutSujet("");
    setFiltreDureeSujet("");
    setFiltreLocalisationSujet("");
    setFiltreNiveauSujet("");
  };

  return {
    sujets,
    setSujets,
    sujetEnModification,
    setSujetEnModification,
    afficherFormulaireSujet,
    setAfficherFormulaireSujet,
    sujetFormulaire,
    setSujetFormulaire,
    chargerSujets,
    ajouterSujet,
    modifierSujet,
    handleModificationSujetChange,
    enregistrerModificationSujet,
    supprimerSujet,
    annulerFormulaireSujet,

    rechercheSujets,
    setRechercheSujets,
    filtreCategorieSujet,
    setFiltreCategorieSujet,
    filtreStatutSujet,
    setFiltreStatutSujet,
    filtreDureeSujet,
    setFiltreDureeSujet,
    filtreLocalisationSujet,
    setFiltreLocalisationSujet,
    filtreNiveauSujet,
    setFiltreNiveauSujet,
    categoriesDisponibles,
    dureesDisponibles,
    localisationsDisponibles,
    niveauxDisponibles,
    sujetsFiltres,
    reinitialiserFiltresSujets,
  };
}
