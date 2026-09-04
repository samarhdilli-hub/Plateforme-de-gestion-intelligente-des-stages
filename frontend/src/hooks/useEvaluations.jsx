import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { evaluationVide } from "../utils/formDefaults";

export function useEvaluations(token) {
  const [evaluations, setEvaluations] = useState([]);
  const [affectationAEvaluer, setAffectationAEvaluer] = useState(null);
  const [evaluationFormulaire, setEvaluationFormulaire] = useState(evaluationVide);

  const chargerEvaluations = async () => {
    try {
      const response = await apiFetch("/evaluations");
      if (!response.ok) throw new Error("Erreur chargement évaluations");
      const data = await response.json();
      setEvaluations(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) {
      chargerEvaluations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const evaluationDeAffectation = (affectationId) =>
    evaluations.find((evaluation) => evaluation.affectation_id === affectationId);

  const ouvrirEvaluation = (affectation) => {
    const existante = evaluationDeAffectation(affectation.id);
    setAffectationAEvaluer(affectation);
    setEvaluationFormulaire(
      existante
        ? { affectation_id: affectation.id, note: existante.note, commentaire: existante.commentaire || "" }
        : { affectation_id: affectation.id, note: "", commentaire: "" }
    );
  };

  const fermerEvaluation = () => {
    setAffectationAEvaluer(null);
    setEvaluationFormulaire(evaluationVide);
  };

  const enregistrerEvaluation = async (e) => {
    e.preventDefault();

    const existante = evaluationDeAffectation(affectationAEvaluer.id);

    const corps = {
      affectation_id: affectationAEvaluer.id,
      note: Number(evaluationFormulaire.note),
      commentaire: evaluationFormulaire.commentaire,
    };

    try {
      const response = await apiFetch(
        existante ? `/evaluations/${existante.id}` : "/evaluations",
        {
          method: existante ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corps),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Erreur lors de l'enregistrement de l'évaluation");
      }

      setEvaluations((anciennes) =>
        existante
          ? anciennes.map((e) => (e.id === data.id ? data : e))
          : [...anciennes, data]
      );

      alert("Évaluation enregistrée !");
      fermerEvaluation();
    } catch (error) {
      console.error(error);
      alert(error.message || "Erreur lors de l'enregistrement de l'évaluation");
    }
  };

  return {
    evaluations,
    affectationAEvaluer,
    evaluationFormulaire,
    setEvaluationFormulaire,
    chargerEvaluations,
    evaluationDeAffectation,
    ouvrirEvaluation,
    fermerEvaluation,
    enregistrerEvaluation,
  };
}
