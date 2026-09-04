import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { affectationVide } from "../utils/formDefaults";

// chargerSujets est passé par la page, car le statut d'un sujet peut
// changer côté backend suite à une affectation (voir services/affectations
// du backend) : il faut recharger les sujets pour rester synchronisé.
export function useAffectations(token, chargerSujets) {
  const [affectations, setAffectations] = useState([]);
  const [afficherFormulaireAffectation, setAfficherFormulaireAffectation] = useState(false);
  const [affectationEnModification, setAffectationEnModification] = useState(null);
  const [affectationFormulaire, setAffectationFormulaire] = useState(affectationVide);

  const chargerAffectations = async () => {
    try {
      const response = await apiFetch("/affectations");

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des affectations");
      }

      const data = await response.json();
      setAffectations(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) {
      chargerAffectations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const annulerFormulaireAffectation = () => {
    setAfficherFormulaireAffectation(false);
    setAffectationEnModification(null);
    setAffectationFormulaire(affectationVide);
  };

  const ajouterAffectation = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch("/affectations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...affectationFormulaire,
          stagiaire_id: Number(affectationFormulaire.stagiaire_id),
          sujet_id: Number(affectationFormulaire.sujet_id),
        }),
      });

      const nouvelleAffectation = await response.json();

      if (!response.ok) {
        throw new Error(nouvelleAffectation.detail || "Erreur lors de l'ajout");
      }

      setAffectations((anciennes) => [...anciennes, nouvelleAffectation]);
      annulerFormulaireAffectation();
      chargerSujets(); // le statut du sujet a pu changer côté backend
      alert("Affectation ajoutée avec succès !");
    } catch (error) {
      console.error(error);
      alert(error.message || "Erreur lors de l'ajout de l'affectation");
    }
  };

  const modifierAffectation = (affectation) => {
    setAffectationEnModification({
      ...affectation,
      stagiaire_id: String(affectation.stagiaire_id),
      sujet_id: String(affectation.sujet_id),
    });
    setAfficherFormulaireAffectation(true);
  };

  const handleModificationAffectationChange = (e) => {
    setAffectationEnModification({
      ...affectationEnModification,
      [e.target.name]: e.target.value,
    });
  };

  const enregistrerModificationAffectation = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch(
        `/affectations/${affectationEnModification.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...affectationEnModification,
            stagiaire_id: Number(affectationEnModification.stagiaire_id),
            sujet_id: Number(affectationEnModification.sujet_id),
          }),
        }
      );

      const affectationModifiee = await response.json();

      if (!response.ok) {
        throw new Error(affectationModifiee.detail || "Erreur lors de la modification");
      }

      setAffectations((anciennes) =>
        anciennes.map((affectation) =>
          affectation.id === affectationModifiee.id ? affectationModifiee : affectation
        )
      );

      annulerFormulaireAffectation();
      alert("Affectation modifiée avec succès !");
    } catch (error) {
      console.error(error);
      alert(error.message || "Erreur lors de la modification de l'affectation");
    }
  };

  const supprimerAffectation = async (id) => {
    if (!window.confirm("Confirmer la suppression de cette affectation ?")) {
      return;
    }

    try {
      const response = await apiFetch(`/affectations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setAffectations((anciennes) =>
        anciennes.filter((affectation) => affectation.id !== id)
      );
      chargerSujets(); // le statut du sujet a pu changer côté backend
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression de l'affectation");
    }
  };

  return {
    affectations,
    afficherFormulaireAffectation,
    setAfficherFormulaireAffectation,
    affectationEnModification,
    setAffectationEnModification,
    affectationFormulaire,
    setAffectationFormulaire,
    chargerAffectations,
    annulerFormulaireAffectation,
    ajouterAffectation,
    modifierAffectation,
    handleModificationAffectationChange,
    enregistrerModificationAffectation,
    supprimerAffectation,
  };
}
