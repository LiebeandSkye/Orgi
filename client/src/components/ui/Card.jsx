export function Card({ children, className = "", title, description }) {
  return (
    <div className={`bg-slate-800 border border-slate-700/80 rounded-xl p-6 shadow-sm ${className}`}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
