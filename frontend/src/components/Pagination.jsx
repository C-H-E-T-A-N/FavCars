export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i).filter(
    (p) => p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 2
  );

  const items = [];
  let prev = null;
  for (const p of pages) {
    if (prev !== null && p - prev > 1) items.push('…');
    items.push(p);
    prev = p;
  }

  return (
    <nav className="pagination">
      <button disabled={page === 0} onClick={() => onPageChange(page - 1)}>← Previous</button>
      {items.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={p === page ? 'pagination-active' : ''}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </button>
        )
      )}
      <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>Next →</button>
    </nav>
  );
}
