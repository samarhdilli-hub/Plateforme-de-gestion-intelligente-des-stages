function Stagiaires({
  stagiaires,
  afficherArchives,
  setAfficherArchives,
  afficherFormulaire,
  setAfficherFormulaire,
  stagiaireEnModification,
  setStagiaireEnModification,
  formulaire,
  ajouterStagiaire,
  modifierStagiaire,
  enregistrerModification,
  supprimerStagiaire,
  archiverStagiaire,
  reactiverStagiaire,
  handleChange,
  handleModificationChange,
  recherche,
  setRecherche,
}) {
  const totalStagiaires = stagiaires.length;

  const stagiairesEnCours = stagiaires.filter(
    (stagiaire) => stagiaire.statut === "En cours"
  ).length;

  const stagiairesTermines = stagiaires.filter(
    (stagiaire) => stagiaire.statut === "Terminé"
  ).length;

  const stagiairesFiltres = stagiaires.filter((stagiaire) => {
    const texte = recherche.toLowerCase();

    return (
      (stagiaire.nom || "").toLowerCase().includes(texte) ||
      (stagiaire.prenom || "").toLowerCase().includes(texte) ||
      (stagiaire.email || "").toLowerCase().includes(texte) ||
      (stagiaire.telephone || "").toLowerCase().includes(texte) ||
      (stagiaire.universite || "").toLowerCase().includes(texte) ||
      (stagiaire.specialite || "").toLowerCase().includes(texte)
    );
  });

  return (
    <>
      {afficherFormulaire && (
        <div className="form-container">
          <h2>Ajouter un stagiaire</h2>

          <form onSubmit={ajouterStagiaire}>
            <div className="form-grid">

              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  value={formulaire.prenom}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="nom"
                  value={formulaire.nom}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date de naissance</label>
                <input
                  type="date"
                  name="date_naissance"
                  value={formulaire.date_naissance}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formulaire.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="text"
                  name="telephone"
                  value={formulaire.telephone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Université</label>
                <input
                  type="text"
                  name="universite"
                  value={formulaire.universite}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Spécialité</label>
                <input
                  type="text"
                  name="specialite"
                  value={formulaire.specialite}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Niveau d'étude</label>
                <input
                  type="text"
                  name="niveau_etude"
                  placeholder="ex. Bac+5, Licence, Master 2"
                  value={formulaire.niveau_etude}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Date de début</label>
                <input
                  type="date"
                  name="date_debut"
                  value={formulaire.date_debut}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date de fin</label>
                <input
                  type="date"
                  name="date_fin"
                  value={formulaire.date_fin}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Statut</label>
                <select
                  name="statut"
                  value={formulaire.statut}
                  onChange={handleChange}
                >
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>

            </div>

            <div className="form-actions">
              <button type="submit" className="btn-enregistrer">
                Enregistrer le stagiaire
              </button>

              <button
                type="button"
                className="btn-annuler"
                onClick={() => setAfficherFormulaire(false)}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {stagiaireEnModification && (
        <div className="form-container">
          <h2>Modifier le stagiaire</h2>

          <form onSubmit={enregistrerModification}>
            <div className="form-grid">

              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  value={stagiaireEnModification.prenom || ""}
                  onChange={handleModificationChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="nom"
                  value={stagiaireEnModification.nom || ""}
                  onChange={handleModificationChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date de naissance</label>
                <input
                  type="date"
                  name="date_naissance"
                  value={stagiaireEnModification.date_naissance || ""}
                  onChange={handleModificationChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={stagiaireEnModification.email || ""}
                  onChange={handleModificationChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="text"
                  name="telephone"
                  value={stagiaireEnModification.telephone || ""}
                  onChange={handleModificationChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Université</label>
                <input
                  type="text"
                  name="universite"
                  value={stagiaireEnModification.universite || ""}
                  onChange={handleModificationChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Spécialité</label>
                <input
                  type="text"
                  name="specialite"
                  value={stagiaireEnModification.specialite || ""}
                  onChange={handleModificationChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Niveau d'étude</label>
                <input
                  type="text"
                  name="niveau_etude"
                  placeholder="ex. Bac+5, Licence, Master 2"
                  value={stagiaireEnModification.niveau_etude || ""}
                  onChange={handleModificationChange}
                />
              </div>

              <div className="form-group">
                <label>Date de début</label>
                <input
                  type="date"
                  name="date_debut"
                  value={stagiaireEnModification.date_debut || ""}
                  onChange={handleModificationChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date de fin</label>
                <input
                  type="date"
                  name="date_fin"
                  value={stagiaireEnModification.date_fin || ""}
                  onChange={handleModificationChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Statut</label>
                <select
                  name="statut"
                  value={stagiaireEnModification.statut || "En cours"}
                  onChange={handleModificationChange}
                >
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>

            </div>

            <div className="form-actions">
              <button type="submit" className="btn-enregistrer">
                Enregistrer les modifications
              </button>

              <button
                type="button"
                className="btn-annuler"
                onClick={() => setStagiaireEnModification(null)}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="stats">
        <div className="stat-card">
          <h3>Total des stagiaires</h3>
          <p>{totalStagiaires}</p>
        </div>

        <div className="stat-card">
          <h3>Stages en cours</h3>
          <p>{stagiairesEnCours}</p>
        </div>

        <div className="stat-card">
          <h3>Stages terminés</h3>
          <p>{stagiairesTermines}</p>
        </div>
      </div>

      <div className="search-container">
        <input
          className="search-input"
          type="text"
          placeholder="🔎 Rechercher un stagiaire..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />

        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", marginLeft: "16px" }}>
          <input
            type="checkbox"
            checked={afficherArchives}
            onChange={(e) => setAfficherArchives(e.target.checked)}
          />
          Afficher les stagiaires archivés
        </label>
      </div>

      <h2>Liste des stagiaires</h2>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Prénom</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Université</th>
              <th>Spécialité</th>
              <th>Niveau</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {stagiairesFiltres.length === 0 ? (
              <tr>
                <td colSpan="10">Aucun stagiaire trouvé.</td>
              </tr>
            ) : (
              stagiairesFiltres.map((stagiaire) => (
                <tr key={stagiaire.id}>
                  <td>{stagiaire.id}</td>
                  <td>{stagiaire.prenom}</td>
                  <td>{stagiaire.nom}</td>
                  <td>{stagiaire.email}</td>
                  <td>{stagiaire.telephone}</td>
                  <td>{stagiaire.universite}</td>
                  <td>{stagiaire.specialite}</td>
                  <td>{stagiaire.niveau_etude || "-"}</td>
                  <td>
                    <span
                      className={`badge-statut ${
                        stagiaire.statut === "En cours"
                          ? "statut-en-cours"
                          : stagiaire.statut === "Terminé"
                          ? "statut-termine"
                          : "statut-annule"
                      }`}
                    >
                      {stagiaire.statut}
                    </span>
                    {stagiaire.archive && (
                      <span className="badge-statut statut-annule" style={{ marginLeft: "6px" }}>
                        Archivé
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-modifier"
                      onClick={() => modifierStagiaire(stagiaire)}
                    >
                      Modifier
                    </button>

                    {stagiaire.archive ? (
                      <button
                        className="btn-modifier"
                        onClick={() => reactiverStagiaire(stagiaire.id)}
                      >
                        Réactiver
                      </button>
                    ) : (
                      <button
                        className="btn-annuler"
                        onClick={() => archiverStagiaire(stagiaire.id)}
                      >
                        Archiver
                      </button>
                    )}

                    <button
                      className="btn-supprimer"
                      onClick={() => supprimerStagiaire(stagiaire.id)}
                    >
                      Supprimer
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

export default Stagiaires;
