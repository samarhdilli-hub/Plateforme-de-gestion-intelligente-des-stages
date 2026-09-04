import Modal from "../components/Modal";
import { classeBadgeAffectation } from "../utils/badges";
import { affectationVide } from "../utils/formDefaults";

function Affectations({
  stagiaires,
  sujets,
  nomStagiaire,
  titreSujet,

  affectations,
  afficherFormulaireAffectation,
  setAfficherFormulaireAffectation,
  affectationEnModification,
  setAffectationEnModification,
  affectationFormulaire,
  setAffectationFormulaire,
  annulerFormulaireAffectation,
  ajouterAffectation,
  modifierAffectation,
  handleModificationAffectationChange,
  enregistrerModificationAffectation,
  supprimerAffectation,

  evaluationDeAffectation,
  affectationAEvaluer,
  evaluationFormulaire,
  setEvaluationFormulaire,
  ouvrirEvaluation,
  fermerEvaluation,
  enregistrerEvaluation,
}) {
  return (
    <>
      <div className="form-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ marginBottom: 0 }}>🔗 Affectations</h2>

          <button
            className="btn-enregistrer"
            type="button"
            onClick={() => {
              if (afficherFormulaireAffectation) {
                annulerFormulaireAffectation();
              } else {
                setAffectationEnModification(null);
                setAffectationFormulaire(affectationVide);
                setAfficherFormulaireAffectation(true);
              }
            }}
          >
            {afficherFormulaireAffectation ? "✕ Fermer" : "+ Nouvelle affectation"}
          </button>
        </div>

        {afficherFormulaireAffectation && (
          <form
            onSubmit={
              affectationEnModification
                ? enregistrerModificationAffectation
                : ajouterAffectation
            }
            style={{ marginTop: "25px" }}
          >
            <div className="form-grid">

              <div className="form-group">
                <label>Stagiaire</label>

                <select
                  name="stagiaire_id"
                  value={
                    affectationEnModification
                      ? affectationEnModification.stagiaire_id
                      : affectationFormulaire.stagiaire_id
                  }
                  onChange={
                    affectationEnModification
                      ? handleModificationAffectationChange
                      : (e) =>
                          setAffectationFormulaire({
                            ...affectationFormulaire,
                            stagiaire_id: e.target.value,
                          })
                  }
                  required
                >
                  <option value="">-- Sélectionner un stagiaire --</option>
                  {stagiaires.map((stagiaire) => (
                    <option key={stagiaire.id} value={stagiaire.id}>
                      {stagiaire.prenom} {stagiaire.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Sujet de stage</label>

                <select
                  name="sujet_id"
                  value={
                    affectationEnModification
                      ? affectationEnModification.sujet_id
                      : affectationFormulaire.sujet_id
                  }
                  onChange={
                    affectationEnModification
                      ? handleModificationAffectationChange
                      : (e) =>
                          setAffectationFormulaire({
                            ...affectationFormulaire,
                            sujet_id: e.target.value,
                          })
                  }
                  required
                >
                  <option value="">-- Sélectionner un sujet --</option>
                  {sujets.map((sujet) => (
                    <option key={sujet.id} value={sujet.id}>
                      {sujet.titre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date d'affectation</label>

                <input
                  type="date"
                  name="date_affectation"
                  value={
                    affectationEnModification
                      ? affectationEnModification.date_affectation || ""
                      : affectationFormulaire.date_affectation
                  }
                  onChange={
                    affectationEnModification
                      ? handleModificationAffectationChange
                      : (e) =>
                          setAffectationFormulaire({
                            ...affectationFormulaire,
                            date_affectation: e.target.value,
                          })
                  }
                />
              </div>

              <div className="form-group">
                <label>Statut</label>

                <select
                  name="statut"
                  value={
                    affectationEnModification
                      ? affectationEnModification.statut
                      : affectationFormulaire.statut
                  }
                  onChange={
                    affectationEnModification
                      ? handleModificationAffectationChange
                      : (e) =>
                          setAffectationFormulaire({
                            ...affectationFormulaire,
                            statut: e.target.value,
                          })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Terminée">Terminée</option>
                  <option value="Annulée">Annulée</option>
                </select>
              </div>

            </div>

            <div className="form-actions">
              <button type="submit" className="btn-enregistrer">
                {affectationEnModification
                  ? "💾 Enregistrer la modification"
                  : "Enregistrer l'affectation"}
              </button>

              <button
                type="button"
                className="btn-annuler"
                onClick={annulerFormulaireAffectation}
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

      <h2>Liste des affectations</h2>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Stagiaire</th>
              <th>Sujet</th>
              <th>Date d'affectation</th>
              <th>Statut</th>
              <th>Évaluation</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {affectations.length === 0 ? (
              <tr>
                <td colSpan="7">Aucune affectation pour le moment.</td>
              </tr>
            ) : (
              affectations.map((affectation) => {
                const evaluation = evaluationDeAffectation(affectation.id);

                return (
                  <tr key={affectation.id}>
                    <td>{affectation.id}</td>
                    <td>{nomStagiaire(affectation.stagiaire_id)}</td>
                    <td>{titreSujet(affectation.sujet_id)}</td>
                    <td>{affectation.date_affectation || "-"}</td>
                    <td>
                      <span
                        className={`badge-statut ${classeBadgeAffectation(
                          affectation.statut
                        )}`}
                      >
                        {affectation.statut}
                      </span>
                    </td>
                    <td>
                      {evaluation ? (
                        <span className="badge-statut statut-termine" title={evaluation.commentaire || ""}>
                          {evaluation.note}/20
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                          Non évaluée
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-modifier"
                        onClick={() => modifierAffectation(affectation)}
                      >
                        ✏️ Modifier
                      </button>

                      <button
                        type="button"
                        className="btn-modifier"
                        onClick={() => ouvrirEvaluation(affectation)}
                      >
                        📝 {evaluation ? "Modifier l'évaluation" : "Évaluer"}
                      </button>

                      <button
                        type="button"
                        className="btn-supprimer"
                        onClick={() => supprimerAffectation(affectation.id)}
                      >
                        🗑️ Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {affectationAEvaluer && (
        <Modal onClose={fermerEvaluation}>
          <h3>
            Évaluation — {nomStagiaire(affectationAEvaluer.stagiaire_id)} /{" "}
            {titreSujet(affectationAEvaluer.sujet_id)}
          </h3>

          <form onSubmit={enregistrerEvaluation}>
            <div className="form-group">
              <label>Note (sur 20)</label>
              <input
                type="number"
                min="0"
                max="20"
                required
                value={evaluationFormulaire.note}
                onChange={(e) =>
                  setEvaluationFormulaire({
                    ...evaluationFormulaire,
                    note: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Commentaire</label>
              <textarea
                rows="4"
                value={evaluationFormulaire.commentaire}
                onChange={(e) =>
                  setEvaluationFormulaire({
                    ...evaluationFormulaire,
                    commentaire: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-enregistrer">
                💾 Enregistrer l'évaluation
              </button>

              <button type="button" className="btn-annuler" onClick={fermerEvaluation}>
                Annuler
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export default Affectations;
