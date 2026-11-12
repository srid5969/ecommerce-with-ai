export const Spinner = ({ label }: { label?: string }) => (
  <span className="spinner" role={label ? 'status' : undefined} aria-label={label} />
);
