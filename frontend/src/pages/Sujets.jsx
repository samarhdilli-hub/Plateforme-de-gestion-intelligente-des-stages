import ImportIA from "./ImportIA";
import { classeBadgeSujet } from "../utils/badges";
import { sujetVide } from "../utils/formDefaults";

function Sujets({
  sujets,
  sujetEnModification,
  setSujetEnModification,
  afficherFormulaireSujet,
  setAfficherFormulaireSujet,
  sujetFormulaire,
  setSujetFormulaire,
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

  importIA,
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
          <h2 style={{ marginBottom: 0 }}>📚 Sujets de stage</h2>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn-annuler"
              type="button"
              onClick={importIA.basculerPanneauImport}
            >
              {importIA.afficherImportSujets ? "✕ Fermer l'import" : "🤖 Importer via IA"}
            </button>

            <button
              className="btn-enregistrer"
              type="button"
              onClick={() => {
                if (afficherFormulaireSujet) {
                  annulerFormulaireSujet();
                } else {
                  setSujetEnModification(null);
                  setSujetFormulaire(sujetVide);
                  setAfficherFormulaireSujet(true);
                }
              }}
            >
              {afficherFormulaireSujet ? "✕ Fermer" : "+ Ajouter un sujet"}
            </button>
          </div>
        </div>

        {importIA.afficherImportSujets && <ImportIA {...importIA} />}

        {afficherFormulaireSujet && (
          <form
            onSubmit={
              sujetEnModification
                ? enregistrerModificationSujet
                : ajouterSujet
            }
            style={{ marginTop: "25px" }}
          >
            <div className="form-grid">

              <div className="form-group">
                <label>Titre du sujet</label>

                <input
                  type="text"
                  name="titre"
                  value={
                    sujetEnModification
                      ? sujetEnModification.titre
                      : sujetFormulaire.titre
                  }
                  onChange={
                    sujetEnModification
                      ? handleModificationSujetChange
                      : (e) =>
                          setSujetFormulaire({
                            ...sujetFormulaire,
                            titre: e.target.value,
                          })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Entreprise</label>

                <input
                  type="text"
                  name="entreprise"
                  value={
                    sujetEnModification
                      ? sujetEnModification.entreprise || ""
                      : sujetFormulaire.entreprise
                  }
                  onChange={
                    sujetEnModification
                      ? handleModificationSujetChange
                      : (e) =>
                          setSujetFormulaire({
                            ...sujetFormulaire,
                            entreprise: e.target.value,
                          })
                  }
                />
              </div>

              <div className="form-group">
                <label>Technologies</label>

                <input
                  type="text"
                  name="technologies"
                  placeholder="React, FastAPI, PostgreSQL..."
                  value={
                    sujetEnModification
                      ? sujetEnModification.technologies || ""
                      : sujetFormulaire.technologies
                  }
                  onChange={
                    sujetEnModification
                      ? handleModificationSujetChange
                      : (e) =>
                          setSujetFormulaire({
                            ...sujetFormulaire,
                            technologies: e.target.value,
                          })
                  }
                />
              </div>

              <div className="form-group">
                <label>Durée</label>

                <input
                  type="text"
                  name="duree"
                  placeholder="3 mois"
                  value={
                    sujetEnModification
                      ? sujetEnModification.duree || ""
                      : sujetFormulaire.duree
                  }
                  onChange={
                    sujetEnModification
                      ? handleModificationSujetChange
                      : (e) =>
                          setSujetFormulaire({
                            ...sujetFormulaire,
                            duree: e.target.value,
                          })
                  }
                />
              </div>

              <div className="form-group">
                <label>Localisation</label>

                <input
                  type="text"
                  name="localisation"
                  placeholder="Tunis, Sfax, Remote..."
                  value={
                    sujetEnModification
                      ? sujetEnModification.localisation || ""
                      : sujetFormulaire.localisation
                  }
                  onChange={
                    sujetEnModification
                      ? handleModificationSujetChange
                      : (e) =>
                          setSujetFormulaire({
                            ...sujetFormulaire,
                            localisation: e.target.value,
                          })
                  }
                />
              </div>

              <div className="form-group">
                <label>Niveau requis</label>

                <input
                  type="text"
                  name="niveau_requis"
                  placeholder="ex. Bac+5, Licence"
                  value={
                    sujetEnModification
                      ? sujetEnModification.niveau_requis || ""
                      : sujetFormulaire.niveau_requis
                  }
                  onChange={
                    sujetEnModification
                      ? handleModificationSujetChange
                      : (e) =>
                          setSujetFormulaire({
                            ...sujetFormulaire,
                            niveau_requis: e.target.value,
                          })
                  }
                />
              </div>

              <div className="form-group">
                <label>Statut</label>

                <select
                  name="statut"
                  value={
                    sujetEnModification
                      ? sujetEnModification.statut
                      : sujetFormulaire.statut
                  }
                  onChange={
                    sujetEnModification
                      ? handleModificationSujetChange
                      : (e) =>
                          setSujetFormulaire({
                            ...sujetFormulaire,
                            statut: e.target.value,
                          })
                  }
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Attribué">Attribué</option>
                  <option value="Terminé">Terminé</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  name="description"
                  rows="4"
                  value={
                    sujetEnModification
                      ? sujetEnModification.description || ""
                      : sujetFormulaire.description
                  }
                  onChange={
                    sujetEnModification
                      ? handleModificationSujetChange
                      : (e) =>
                          setSujetFormulaire({
                            ...sujetFormulaire,
                            description: e.target.value,
                          })
                  }
                />
              </div>

            </div>

            <div className="form-actions">
              <button type="submit" className="btn-enregistrer">
                {sujetEnModification
                  ? "💾 Enregistrer la modification"
                  : "Enregistrer le sujet"}
              </button>

              <button
                type="button"
                className="btn-annuler"
                onClick={annulerFormulaireSujet}
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

      <div style={{ marginTop: "25px" }}>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: "2 1 260px" }}>
            <div className="search-container" style={{ marginBottom: 0 }}>
              <input
                className="search-input"
                type="text"
                placeholder="🔎 Rechercher un sujet (titre, entreprise, technologies...)"
                value={rechercheSujets}
                onChange={(e) => setRechercheSujets(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ flex: "1 1 160px" }}>
            <label>Catégorie</label>
            <select
              value={filtreCategorieSujet}
              onChange={(e) => setFiltreCategorieSujet(e.target.value)}
            >
              <option value="">Toutes</option>
              {categoriesDisponibles.map((categorie) => (
                <option key={categorie} value={categorie}>
                  {categorie}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ flex: "1 1 160px" }}>
            <label>Statut</label>
            <select
              value={filtreStatutSujet}
              onChange={(e) => setFiltreStatutSujet(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="Disponible">Disponible</option>
              <option value="Attribué">Attribué</option>
              <option value="Terminé">Terminé</option>
            </select>
          </div>

          <div className="form-group" style={{ flex: "1 1 140px" }}>
            <label>Durée</label>
            <select
              value={filtreDureeSujet}
              onChange={(e) => setFiltreDureeSujet(e.target.value)}
            >
              <option value="">Toutes</option>
              {dureesDisponibles.map((duree) => (
                <option key={duree} value={duree}>
                  {duree}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ flex: "1 1 160px" }}>
            <label>Localisation</label>
            <select
              value={filtreLocalisationSujet}
              onChange={(e) => setFiltreLocalisationSujet(e.target.value)}
            >
              <option value="">Toutes</option>
              {localisationsDisponibles.map((localisation) => (
                <option key={localisation} value={localisation}>
                  {localisation}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ flex: "1 1 140px" }}>
            <label>Niveau requis</label>
            <select
              value={filtreNiveauSujet}
              onChange={(e) => setFiltreNiveauSujet(e.target.value)}
            >
              <option value="">Tous</option>
              {niveauxDisponibles.map((niveau) => (
                <option key={niveau} value={niveau}>
                  {niveau}
                </option>
              ))}
            </select>
          </div>

          {(rechercheSujets || filtreCategorieSujet || filtreStatutSujet || filtreDureeSujet || filtreLocalisationSujet || filtreNiveauSujet) && (
            <button
              type="button"
              className="btn-annuler"
              onClick={reinitialiserFiltresSujets}
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>

        <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "10px" }}>
          {sujetsFiltres.length} sujet(s) sur {sujets.length}
        </p>
      </div>

      <h2>Liste des sujets de stage</h2>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Titre</th>
              <th>Description</th>
              <th>Entreprise</th>
              <th>Technologies</th>
              <th>Catégorie</th>
              <th>Durée</th>
              <th>Localisation</th>
              <th>Niveau</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {sujetsFiltres.length === 0 ? (
              <tr>
                <td colSpan="11">
                  {sujets.length === 0
                    ? "Aucun sujet de stage disponible."
                    : "Aucun sujet ne correspond à ces critères."}
                </td>
              </tr>
            ) : (
              sujetsFiltres.map((sujet) => (
                <tr key={sujet.id}>
                  <td>{sujet.id}</td>
                  <td>
                    {sujet.titre}
                    {sujet.obsolete && (
                      <span
                        className="badge-statut statut-annule"
                        style={{ marginLeft: "6px" }}
                        title="Toujours disponible depuis plus de 90 jours"
                      >
                        Obsolète ?
                      </span>
                    )}
                  </td>
                  <td>{sujet.description || "-"}</td>
                  <td>{sujet.entreprise || "-"}</td>
                  <td>{sujet.technologies || "-"}</td>
                  <td>{sujet.categorie || "-"}</td>
                  <td>{sujet.duree || "-"}</td>
                  <td>{sujet.localisation || "-"}</td>
                  <td>{sujet.niveau_requis || "-"}</td>
                  <td>
                    <span
                      className={`badge-statut ${classeBadgeSujet(
                        sujet.statut
                      )}`}
                    >
                      {sujet.statut}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-modifier"
                      onClick={() => modifierSujet(sujet)}
                    >
                      ✏️ Modifier
                    </button>

                    <button
                      type="button"
                      className="btn-supprimer"
                      onClick={() => supprimerSujet(sujet.id)}
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

export default Sujets;
