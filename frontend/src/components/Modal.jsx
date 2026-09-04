// Fenêtre modale générique : fond assombri cliquable pour fermer, contenu
// centré qui intercepte ses propres clics pour ne pas se fermer par erreur.
function Modal({ onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default Modal;
