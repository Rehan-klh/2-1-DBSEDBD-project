import Badge from './Badge'

function DataTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.name || row.day || index}>
              {columns.map((column) => {
                const value = row[column.key]
                return (
                  <td key={column.key}>
                    {column.render ? column.render(row) : column.badge ? <Badge>{value}</Badge> : value}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
