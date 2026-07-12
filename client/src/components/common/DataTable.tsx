import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Column<T> = {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}

type DataTableProps<T extends Record<string, unknown>> = {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  pageSize?: number
  emptyMessage?: string
  actions?: (row: T) => React.ReactNode
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  pageSize = 10,
  emptyMessage = 'No records found',
  actions,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const allColumns = useMemo(() => {
    if (!actions) {
      return columns
    }

    return [...columns, { key: '__actions', header: 'Actions', render: actions }]
  }, [actions, columns])

  const sortedData = useMemo(() => {
    const dataCopy = [...data]

    if (!sortKey) {
      return dataCopy
    }

    return dataCopy.sort((left, right) => {
      const leftValue = left[sortKey]
      const rightValue = right[sortKey]
      const comparison = String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, {
        numeric: true,
      })

      return sortDirection === 'asc' ? comparison : comparison * -1
    })
  }, [data, sortDirection, sortKey])

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const paginatedData = sortedData.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleSort = (columnKey: string) => {
    if (sortKey === columnKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(columnKey)
    setSortDirection('asc')
  }

  const renderState = () => {
    if (isLoading) {
      return (
        <tbody>
          {Array.from({ length: 4 }).map((_, index) => (
            <tr key={index} className="border-t border-border">
              {allColumns.map((column) => (
                <td key={column.key} className="px-3 py-3">
                  <div className="h-4 animate-pulse rounded bg-muted" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      )
    }

    if (data.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={allColumns.length} className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </td>
          </tr>
        </tbody>
      )
    }

    return (
      <tbody>
        {paginatedData.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-t border-border">
            {allColumns.map((column) => (
              <td key={column.key} className="px-3 py-3 align-top text-sm text-foreground">
                {column.render ? column.render(row) : (row[column.key] as React.ReactNode)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    )
  }

  return (
    <Card>
      <div className="overflow-hidden rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {allColumns.map((column) => {
                  const isSorted = sortKey === column.key
                  const Icon = isSorted && sortDirection === 'asc' ? ChevronUp : ChevronDown

                  return (
                    <th key={column.key} className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {column.sortable ? (
                        <button
                          className="inline-flex items-center gap-1"
                          type="button"
                          onClick={() => handleSort(column.key)}
                        >
                          <span>{column.header}</span>
                          <Icon className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span>{column.header}</span>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            {renderState()}
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-3 text-sm">
          <span className="text-muted-foreground">
            Page {safePage} of {pageCount}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1}>
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={safePage === pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
