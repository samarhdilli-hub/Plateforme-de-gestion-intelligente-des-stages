import { PALETTE_GRAPHIQUES } from "../utils/badges";

function GraphiqueDonut({ titre, donnees }) {
  const total = donnees.reduce((somme, d) => somme + d.valeur, 0);

  let cumulPourcent = 0;
  const segments = donnees.map((d, i) => {
    const pourcent = total > 0 ? (d.valeur / total) * 100 : 0;
    const debut = cumulPourcent;
    cumulPourcent += pourcent;
    return `${PALETTE_GRAPHIQUES[i % PALETTE_GRAPHIQUES.length]} ${debut}% ${cumulPourcent}%`;
  });

  const gradient = segments.length > 0
    ? `conic-gradient(${segments.join(", ")})`
    : "var(--line)";

  return (
    <div className="graphique-carte">
      <h3>{titre}</h3>

      {donnees.length === 0 ? (
        <p className="graphique-vide">Aucune donnée pour le moment.</p>
      ) : (
        <div className="graphique-donut-conteneur">
          <div className="graphique-donut" style={{ background: gradient }}>
            <div className="graphique-donut-centre">{total}</div>
          </div>

          <ul className="graphique-legende">
            {donnees.map((d, i) => (
              <li key={d.label}>
                <span
                  className="legende-puce"
                  style={{ background: PALETTE_GRAPHIQUES[i % PALETTE_GRAPHIQUES.length] }}
                />
                <span className="legende-texte">
                  {d.label} — {d.valeur} ({total > 0 ? Math.round((d.valeur / total) * 100) : 0}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default GraphiqueDonut;
