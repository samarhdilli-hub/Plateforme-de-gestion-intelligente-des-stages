import { classeBadgeRole } from "../utils/badges";
import { utilisateurVide } from "../utils/formDefaults";

function Utilisateurs({
  utilisateurs,
  afficherFormulaireUtilisateur,
  setAfficherFormulaireUtilisateur,
  utilisateurEnModification,
  setUtilisateurEnModification,
  utilisateurFormulaire,
  setUtilisateurFormulaire,
  annulerFormulaireUtilisateur,
  ajouterUtilisateur,
  modifierUtilisateur,
  handleModificationUtilisateurChange,
  enregistrerModificationUtilisateur,
  supprimerUtilisateur,
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
          <h2 style={{ marginBottom: 0 }}>👤 Utilisateurs</h2>

          <button
            className="btn-enregistrer"
            type="button"
            onClick={() => {
              if (afficherFormulaireUtilisateur) {
                annulerFormulaireUtilisateur();
              } else {
                setUtilisateurEnModification(null);
                setUtilisateurFormulaire(utilisateurVide);
                setAfficherFormulaireUtilisateur(true);
              }
            }}
          >
            {afficherFormulaireUtilisateur ? "✕ Fermer" : "+ Nouvel utilisateur"}
          </button>
        </div>

        {afficherFormulaireUtilisateur && (
          <form
            onSubmit={
              utilisateurEnModification
                ? enregistrerModificationUtilisateur
                : ajouterUtilisateur
            }
            style={{ marginTop: "25px" }}
          >
            <div className="form-grid">

              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  value={
                    utilisateurEnModification
                      ? utilisateurEnModification.prenom
                      : utilisateurFormulaire.prenom
                  }
                  onChange={
                    utilisateurEnModification
                      ? handleModificationUtilisateurChange
                      : (e) =>
                          setUtilisateurFormulaire({
                            ...utilisateurFormulaire,
                            prenom: e.target.value,
                          })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="nom"
                  value={
                    utilisateurEnModification
                      ? utilisateurEnModification.nom
                      : utilisateurFormulaire.nom
                  }
                  onChange={
                    utilisateurEnModification
                      ? handleModificationUtilisateurChange
                      : (e) =>
                          setUtilisateurFormulaire({
                            ...utilisateurFormulaire,
                            nom: e.target.value,
                          })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={
                    utilisateurEnModification
                      ? utilisateurEnModification.email
                      : utilisateurFormulaire.email
                  }
                  onChange={
                    utilisateurEnModification
                      ? handleModificationUtilisateurChange
                      : (e) =>
                          setUtilisateurFormulaire({
                            ...utilisateurFormulaire,
                            email: e.target.value,
                          })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Mot de passe
                  {utilisateurEnModification && (
                    <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>
                      {" "}(laisser vide pour ne pas le changer)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  name="mot_de_passe"
                  value={
                    utilisateurEnModification
                      ? utilisateurEnModification.mot_de_passe
                      : utilisateurFormulaire.mot_de_passe
                  }
                  onChange={
                    utilisateurEnModification
                      ? handleModificationUtilisateurChange
                      : (e) =>
                          setUtilisateurFormulaire({
                            ...utilisateurFormulaire,
                            mot_de_passe: e.target.value,
                          })
                  }
                  required={!utilisateurEnModification}
                  minLength={8}
                />
              </div>

              <div className="form-group">
                <label>Rôle</label>
                <select
                  name="role"
                  value={
                    utilisateurEnModification
                      ? utilisateurEnModification.role
                      : utilisateurFormulaire.role
                  }
                  onChange={
                    utilisateurEnModification
                      ? handleModificationUtilisateurChange
                      : (e) =>
                          setUtilisateurFormulaire({
                            ...utilisateurFormulaire,
                            role: e.target.value,
                          })
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="encadrant">Encadrant</option>
                  <option value="stagiaire">Stagiaire</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="actif"
                    checked={
                      utilisateurEnModification
                        ? utilisateurEnModification.actif
                        : utilisateurFormulaire.actif
                    }
                    onChange={
                      utilisateurEnModification
                        ? handleModificationUtilisateurChange
                        : (e) =>
                            setUtilisateurFormulaire({
                              ...utilisateurFormulaire,
                              actif: e.target.checked,
                            })
                    }
                    style={{ width: "auto", marginRight: "8px" }}
                  />
                  Compte actif
                </label>
              </div>

            </div>

            <div className="form-actions">
              <button type="submit" className="btn-enregistrer">
                {utilisateurEnModification
                  ? "💾 Enregistrer la modification"
                  : "Enregistrer l'utilisateur"}
              </button>

              <button
                type="button"
                className="btn-annuler"
                onClick={annulerFormulaireUtilisateur}
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

      <h2>Liste des utilisateurs</h2>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Prénom</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {utilisateurs.length === 0 ? (
              <tr>
                <td colSpan="7">Aucun utilisateur pour le moment.</td>
              </tr>
            ) : (
              utilisateurs.map((utilisateur) => (
                <tr key={utilisateur.id}>
                  <td>{utilisateur.id}</td>
                  <td>{utilisateur.prenom}</td>
                  <td>{utilisateur.nom}</td>
                  <td>{utilisateur.email}</td>
                  <td>
                    <span
                      className={`badge-statut ${classeBadgeRole(utilisateur.role)}`}
                    >
                      {utilisateur.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge-statut ${
                        utilisateur.actif ? "statut-en-cours" : "statut-annule"
                      }`}
                    >
                      {utilisateur.actif ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-modifier"
                      onClick={() => modifierUtilisateur(utilisateur)}
                    >
                      ✏️ Modifier
                    </button>

                    <button
                      type="button"
                      className="btn-supprimer"
                      onClick={() => supprimerUtilisateur(utilisateur.id)}
                    >
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Utilisateurs;
