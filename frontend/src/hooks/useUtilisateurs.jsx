import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { utilisateurVide } from "../utils/formDefaults";

export function useUtilisateurs(token) {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [afficherFormulaireUtilisateur, setAfficherFormulaireUtilisateur] = useState(false);
  const [utilisateurEnModification, setUtilisateurEnModification] = useState(null);
  const [utilisateurFormulaire, setUtilisateurFormulaire] = useState(utilisateurVide);

  const chargerUtilisateurs = async () => {
    try {
      const response = await apiFetch("/utilisateurs");

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des utilisateurs");
      }

      const data = await response.json();
      setUtilisateurs(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) {
      chargerUtilisateurs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const annulerFormulaireUtilisateur = () => {
    setAfficherFormulaireUtilisateur(false);
    setUtilisateurEnModification(null);
    setUtilisateurFormulaire(utilisateurVide);
  };

  const ajouterUtilisateur = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch("/utilisateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(utilisateurFormulaire),
      });

      const nouvelUtilisateur = await response.json();

      if (!response.ok) {
        throw new Error(nouvelUtilisateur.detail || "Erreur lors de l'ajout");
      }

      setUtilisateurs((anciens) => [...anciens, nouvelUtilisateur]);
      annulerFormulaireUtilisateur();
      alert("Utilisateur ajouté avec succès !");
    } catch (error) {
      console.error(error);
      alert(error.message || "Erreur lors de l'ajout de l'utilisateur");
    }
  };

  const modifierUtilisateur = (utilisateur) => {
    setUtilisateurEnModification({ ...utilisateur, mot_de_passe: "" });
    setAfficherFormulaireUtilisateur(true);
  };

  const handleModificationUtilisateurChange = (e) => {
    const { name, value, type, checked } = e.target;

    setUtilisateurEnModification({
      ...utilisateurEnModification,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const enregistrerModificationUtilisateur = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch(
        `/utilisateurs/${utilisateurEnModification.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(utilisateurEnModification),
        }
      );

      const utilisateurModifie = await response.json();

      if (!response.ok) {
        throw new Error(utilisateurModifie.detail || "Erreur lors de la modification");
      }

      setUtilisateurs((anciens) =>
        anciens.map((utilisateur) =>
          utilisateur.id === utilisateurModifie.id ? utilisateurModifie : utilisateur
        )
      );

      annulerFormulaireUtilisateur();
      alert("Utilisateur modifié avec succès !");
    } catch (error) {
      console.error(error);
      alert(error.message || "Erreur lors de la modification de l'utilisateur");
    }
  };

  const supprimerUtilisateur = async (id) => {
    if (!window.confirm("Confirmer la suppression de cet utilisateur ?")) {
      return;
    }

    try {
      const response = await apiFetch(`/utilisateurs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setUtilisateurs((anciens) =>
        anciens.filter((utilisateur) => utilisateur.id !== id)
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression de l'utilisateur");
    }
  };

  return {
    utilisateurs,
    afficherFormulaireUtilisateur,
    setAfficherFormulaireUtilisateur,
    utilisateurEnModification,
    setUtilisateurEnModification,
    utilisateurFormulaire,
    setUtilisateurFormulaire,
    chargerUtilisateurs,
    annulerFormulaireUtilisateur,
    ajouterUtilisateur,
    modifierUtilisateur,
    handleModificationUtilisateurChange,
    enregistrerModificationUtilisateur,
    supprimerUtilisateur,
  };
}
