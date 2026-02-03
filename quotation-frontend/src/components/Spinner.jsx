export default function Spinner({ size = 24, className = "" }) {
  const px = Number(size) || 24;
  return (
    <span
      className={`ui-spinner ${className}`}
      style={{ width: px, height: px }}
      aria-hidden="true"
    />
  );
}
