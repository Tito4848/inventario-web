type Props = {
  page: number
  pageCount: number
  onPageChange: (p: number) => void
}

export default function Pagination({ page, pageCount, onPageChange }: Props) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1)
  return (
    <div className="flex items-center gap-2">
      <button
        className="px-2 py-1 rounded-md bg-white/5"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Prev
      </button>

      {pages.map((p) => (
        <button
          key={p}
          className={`px-3 py-1 rounded-md ${p === page ? 'bg-primary-500 text-white' : 'bg-white/3'}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      <button
        className="px-2 py-1 rounded-md bg-white/5"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
      >
        Next
      </button>
    </div>
  )
}
