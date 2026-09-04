// Panneau d'import intelligent de sujets (PDF / Word / Excel / CSV / JSON / URL).
// Affiché en incrustation dans la page Sujets lorsque l'utilisateur clique
// sur "Importer via IA".
function ImportIA({
  modeImport,
  setModeImport,
  fichierImport,
  setFichierImport,
  urlImport,
  setUrlImport,
  chargementImport,
  erreurImport,
  sujetsExtraits,
  analyserFichierImport,
  basculerSelectionSujetExtrait,
  confirmerImportSujets,
  basculerPanneauImport,
}) {
  return (
    <div style={{ marginTop: "25px" }}>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
        Importez un ou plusieurs sujets de stage depuis un fichier
        (PDF, Word, Excel, CSV, JSON) ou depuis l'URL d'un export
        généré par un système externe. Le système extraira
        automatiquement les informations, proposera une catégorie
        et signalera les doublons probables avant tout
        enregistrement.
      </p>

      <div className="form-tabs" style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
        <button
          type="button"
          className={modeImport === "fichier" ? "btn-enregistrer" : "btn-annuler"}
          onClick={() => setModeImport("fichier")}
        >
          Fichier
        </button>
        <button
          type="button"
          className={modeImport === "url" ? "btn-enregistrer" : "btn-annuler"}
          onClick={() => setModeImport("url")}
        >
          Depuis une URL (base externe)
        </button>
      </div>

      <form
        onSubmit={analyserFichierImport}
        style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}
      >
        {modeImport === "fichier" ? (
          <input
            type="file"
            accept=".pdf,.docx,.xlsx,.xls,.csv,.json"
            onChange={(e) => setFichierImport(e.target.files[0] || null)}
          />
        ) : (
          <input
            type="url"
            placeholder="https://exemple.com/export-sujets.json"
            value={urlImport}
            onChange={(e) => setUrlImport(e.target.value)}
            style={{ minWidth: "320px" }}
          />
        )}

        <button
          type="submit"
          className="btn-enregistrer"
          disabled={chargementImport}
        >
          {chargementImport ? "Analyse en cours..." : "Analyser"}
        </button>
      </form>

      {erreurImport && (
        <p style={{ color: "var(--red)", fontSize: "13px", marginTop: "10px" }}>
          {erreurImport}
        </p>
      )}

      {sujetsExtraits.length > 0 && (
        <>
          <p style={{ marginTop: "20px", fontWeight: 600, fontSize: "14px" }}>
            {sujetsExtraits.length} sujet(s) détecté(s) — décochez ceux
            que vous ne souhaitez pas importer :
          </p>

          <div className="table-container" style={{ marginTop: "10px" }}>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Titre</th>
                  <th>Entreprise</th>
                  <th>Technologies</th>
                  <th>Localisation</th>
                  <th>Niveau</th>
                  <th>Catégorie (IA)</th>
                  <th>Doublon probable</th>
                </tr>
              </thead>

              <tbody>
                {sujetsExtraits.map((sujet, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="checkbox"
                        checked={sujet.selectionne}
                        onChange={() => basculerSelectionSujetExtrait(index)}
                      />
                    </td>
                    <td>{sujet.titre}</td>
                    <td>{sujet.entreprise || "-"}</td>
                    <td>{sujet.technologies || "-"}</td>
                    <td>{sujet.localisation || "-"}</td>
                    <td>{sujet.niveau_requis || "-"}</td>
                    <td>{sujet.categorie || "-"}</td>
                    <td>
                      {sujet.doublon_probable ? (
                        <span
                          className="badge-statut statut-annule"
                          title={`Similaire à "${sujet.doublon_probable.titre}"`}
                        >
                          {sujet.doublon_probable.similarite}% — "
                          {sujet.doublon_probable.titre}"
                        </span>
                      ) : (
                        <span className="badge-statut statut-en-cours">
                          Nouveau
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-enregistrer"
              onClick={confirmerImportSujets}
              disabled={chargementImport}
            >
              {chargementImport
                ? "Import en cours..."
                : `✅ Confirmer l'import (${sujetsExtraits.filter((s) => s.selectionne).length} sélectionné(s))`}
            </button>

            <button
              type="button"
              className="btn-annuler"
              onClick={basculerPanneauImport}
            >
              Annuler
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ImportIA;
