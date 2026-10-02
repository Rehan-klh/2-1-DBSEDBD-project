import Badge from './Badge'

function DataTable({ columns, rows, emptyMessage = 'No records found.' }) {
  return (
    <div className="table-wrap" role="region" aria-label="Data table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id ?? row.name ?? row.day ?? index}>
                {columns.map((column) => {
                  const value = row[column.key]
                  return (
                    <td key={column.key}>
                      {column.render
                        ? column.render(row)
                        : column.badge
                          ? <Badge>{value}</Badge>
                          : value}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
