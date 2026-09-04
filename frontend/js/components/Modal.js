// Dark Fintech Modal Component
window.Modal = function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className={`bg-surface-card border border-surface-border rounded-2xl w-full ${maxWidth} shadow-2xl overflow-hidden animate-slideUp`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-subtle">
          <h3 className="text-base font-bold text-slate-100 tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-cardHover hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};
