export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <ul className="skeleton-grid">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <div className="skeleton-card">
            <div className="shimmer badge-line" />
            <div className="shimmer title-line" />
            <div className="shimmer meta-line" />
          </div>
        </li>
      ))}
    </ul>
  )
}
