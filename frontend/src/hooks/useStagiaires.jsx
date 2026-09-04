import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../services/api";
import { formulaireVide } from "../utils/formDefaults";

export function useStagiaires(token) {
  const [stagiaires, setStagiaires] = useState([]);
  const [afficherArchives, setAfficherArchives] = useState(false);

  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [stagiaireEnModification, setStagiaireEnModification] = useState(null);
  const [formulaire, setFormulaire] = useState(formulaireVide);

  // Utilisation de useCallback pour stabiliser la fonction
  const chargerStagiaires = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiFetch(
        `/stagiaires?inclure_archives=${afficherArchives ? "true" : "false"}`
      );
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setStagiaires(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur lors du chargement des stagiaires :", error);
    }
  }, [token, afficherArchives]);

  useEffect(() => {
    chargerStagiaires();
  }, [chargerStagiaires]);

  const ajouterStagiaire = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch("/stagiaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulaire),
      });

      if (!response.ok) throw new Error("Erreur lors de l'ajout");

      const nouveauStagiaire = await response.json();
      setStagiaires((anciens) => [...anciens, nouveauStagiaire]);
      setFormulaire(formulaireVide);
      setAfficherFormulaire(false);

      alert("Stagiaire ajouté avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur de connexion avec le serveur");
    }
  };

  const modifierStagiaire = (stagiaire) => {
    setStagiaireEnModification({ ...stagiaire });
    setAfficherFormulaire(false);
  };

  const enregistrerModification = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch(
        `/stagiaires/${stagiaireEnModification.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stagiaireEnModification),
        }
      );

      if (!response.ok) throw new Error("Erreur lors de la modification");

      const stagiaireModifie = await response.json();

      setStagiaires((anciens) =>
        anciens.map((stagiaire) =>
          String(stagiaire.id) === String(stagiaireModifie.id)
            ? stagiaireModifie
            : stagiaire
        )
      );

      setStagiaireEnModification(null);
      alert("Stagiaire modifié avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la modification");
    }
  };

  const supprimerStagiaire = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce stagiaire ?")) {
      return;
    }

    try {
      const response = await apiFetch(`/stagiaires/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const erreur = await response.json().catch(() => null);
        throw new Error(erreur?.detail || "Erreur lors de la suppression");
      }

      setStagiaires((anciens) =>
        anciens.filter((stagiaire) => String(stagiaire.id) !== String(id))
      );

      alert("Stagiaire supprimé avec succès !");
    } catch (error) {
      console.error(error);
      alert(error.message || "Erreur lors de la suppression");
    }
  };

  const archiverStagiaire = async (id) => {
    if (
      !window.confirm(
        "Archiver ce stagiaire ? Il n'apparaîtra plus dans la liste active."
      )
    ) {
      return;
    }

    try {
      const response = await apiFetch(`/stagiaires/${id}/archiver`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error("Erreur lors de l'archivage");

      setStagiaires((anciens) =>
        afficherArchives
          ? anciens.map((s) =>
              String(s.id) === String(id) ? { ...s, archive: true } : s
            )
          : anciens.filter((s) => String(s.id) !== String(id))
      );

      alert("Stagiaire archivé.");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'archivage");
    }
  };

  const reactiverStagiaire = async (id) => {
    try {
      const response = await apiFetch(`/stagiaires/${id}/reactiver`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error("Erreur lors de la réactivation");

      setStagiaires((anciens) =>
        anciens.map((s) =>
          String(s.id) === String(id) ? { ...s, archive: false } : s
        )
      );

      alert("Stagiaire réactivé.");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la réactivation");
    }
  };

  const handleChange = (e) => {
    setFormulaire({
      ...formulaire,
      [e.target.name]: e.target.value,
    });
  };

  const handleModificationChange = (e) => {
    setStagiaireEnModification({
      ...stagiaireEnModification,
      [e.target.name]: e.target.value,
    });
  };

  return {
    stagiaires,
    afficherArchives,
    setAfficherArchives,
    afficherFormulaire,
    setAfficherFormulaire,
    stagiaireEnModification,
    setStagiaireEnModification,
    formulaire,
    setFormulaire,
    chargerStagiaires,
    ajouterStagiaire,
    modifierStagiaire,
    enregistrerModification,
    supprimerStagiaire,
    archiverStagiaire,
    reactiverStagiaire,
    handleChange,
    handleModificationChange,
  };
}