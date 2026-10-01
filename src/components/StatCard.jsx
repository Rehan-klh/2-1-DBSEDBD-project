function StatCard({ label, value, helper, tone = 'blue' }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-accent" />
      <p>{label}</p>
      <strong>{value}</strong>
      {helper ? <span>{helper}</span> : null}
    </article>
  )
}

export default StatCard
