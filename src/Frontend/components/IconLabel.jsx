export default function IconLabel({ icon: Icon, children, size = 14, className = "" }) {
  return (
    <span className={`icon-label${className ? ` ${className}` : ""}`}>
      {Icon ? <Icon size={size} strokeWidth={1.5} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
