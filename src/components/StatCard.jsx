function StatCard({ label, value, helper, tone = 'blue' }) {
  return (
    <article className={`stat-card stat-${tone}`} aria-label={`${label}: ${value}`}>
      <div className="stat-accent" aria-hidden="true" />
      <p>{label}</p>
      <strong>{value}</strong>
      {helper ? <span>{helper}</span> : null}
    </article>
  )
}

export default StatCard
