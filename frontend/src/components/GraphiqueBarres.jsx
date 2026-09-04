// Graphique en barres horizontales, en CSS pur (pas de librairie externe).
function GraphiqueBarres({ titre, donnees, couleur = "var(--indigo)" }) {
  const maxValeur = Math.max(1, ...donnees.map((d) => d.valeur));

  return (
    <div className="graphique-carte">
      <h3>{titre}</h3>

      {donnees.length === 0 ? (
        <p className="graphique-vide">Aucune donnée pour le moment.</p>
      ) : (
        <div className="graphique-barres">
          {donnees.map((d) => (
            <div className="barre-ligne" key={d.label}>
              <span className="barre-label" title={d.label}>{d.label}</span>

              <div className="barre-piste">
                <div
                  className="barre-remplissage"
                  style={{
                    width: `${(d.valeur / maxValeur) * 100}%`,
                    background: couleur,
                  }}
                />
              </div>

              <span className="barre-valeur">{d.valeur}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GraphiqueBarres;
