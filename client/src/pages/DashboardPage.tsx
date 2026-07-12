import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/common/DataTable'
import { useDashboardSummary } from '@/api/dashboard.api'

const statusColorMap: Record<string, string> = {
  active: '#2563eb',
  maintenance: '#f59e0b',
  idle: '#64748b',
}

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboardSummary()
  const hasValidSummary = Boolean(data?.summary && data.dispatchTrend && data.vehicleStatusBreakdown && data.recentActivity)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="h-64 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError || !hasValidSummary || !data) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-body text-danger">{error instanceof Error ? error.message : 'The dashboard could not be loaded.'}</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const summaryCards = [
    { label: 'Active Vehicles', value: data.summary.activeVehicles, trend: '↑ 4.2% vs last week' },
    { label: 'Pending Dispatches', value: data.summary.pendingDispatches, trend: '3 high-priority' },
    { label: 'Maintenance Due', value: data.summary.maintenanceDue, trend: '1 overdue' },
    { label: 'Total Expenses (This Month)', value: `$${data.summary.totalExpenses.toLocaleString()}`, trend: 'On track' },
  ]

  const tableColumns = [
    { key: 'date', header: 'Date', sortable: true },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'description', header: 'Description', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: (typeof data.recentActivity)[number]) => <Badge variant={row.status === 'Pending' ? 'warning' : row.status === 'Scheduled' ? 'success' : 'info'}>{row.status}</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <p className="text-caption text-muted-foreground">{card.label}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-display">{card.value}</p>
              <p className="text-caption text-muted-foreground">{card.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dispatches over the last 7 days</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dispatchTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="dispatches" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle status breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.vehicleStatusBreakdown} dataKey="count" nameKey="status" outerRadius={90} innerRadius={45} fill="#2563eb">
                  {data.vehicleStatusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={statusColorMap[entry.status] ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-heading">Recent activity</h2>
        <DataTable
          columns={tableColumns}
          data={data.recentActivity}
          isLoading={false}
          pageSize={5}
          emptyMessage="No recent activity to show"
        />
      </div>
    </div>
  )
}
