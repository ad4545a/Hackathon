import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getExpenses, createExpense, getFuelLogs, createFuelLog } from '@/api/expenses.api';
import type { Expense, FuelLog } from '@/api/expenses.api';
import { getVehicles } from '@/api/vehicles.api';
import { useAuth } from '@/hooks/use-auth';
import { DataTable } from '@/components/common/DataTable';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';

// Expense Form Schema
const expenseFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  type: z.enum(['FUEL', 'TOLL', 'MAINTENANCE', 'REPAIR', 'OTHER']),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

// Fuel Log Form Schema
const fuelFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  liters: z.coerce.number().positive('Liters must be positive'),
  cost: z.coerce.number().positive('Cost must be positive'),
  odometer: z.coerce.number().nonnegative('Odometer must be non-negative'),
  date: z.string().min(1, 'Date is required'),
});

type FuelFormValues = z.infer<typeof fuelFormSchema>;

export function ExpensesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isFinanceOrAdmin = user?.role === 'FLEET_MANAGER' || user?.role === 'FINANCIAL_ANALYST';
  const isDispatcherOrAbove = user?.role === 'FLEET_MANAGER' || user?.role === 'DISPATCHER' || user?.role === 'FINANCIAL_ANALYST';

  // Tabs state: 'expenses' | 'fuel'
  const [activeTab, setActiveTab] = useState<'expenses' | 'fuel'>('expenses');

  // Sheet states
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isFuelOpen, setIsFuelOpen] = useState(false);

  // Forms setup
  const expenseForm = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema) as any,
    defaultValues: {
      vehicleId: '',
      type: 'TOLL',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const fuelForm = useForm<FuelFormValues>({
    resolver: zodResolver(fuelFormSchema) as any,
    defaultValues: {
      vehicleId: '',
      liters: 0,
      cost: 0,
      odometer: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Queries
  const { data: expensesData, isLoading: isExpensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => getExpenses(),
    enabled: activeTab === 'expenses',
  });

  const { data: fuelLogsData, isLoading: isFuelLoading } = useQuery({
    queryKey: ['fuel-logs'],
    queryFn: getFuelLogs,
    enabled: activeTab === 'fuel',
  });

  // Query vehicles for select option dropdowns
  const { data: vehiclesData } = useQuery({
    queryKey: ['all-vehicles-dropdown'],
    queryFn: () => getVehicles({ limit: 100 }),
    enabled: isExpenseOpen || isFuelOpen,
  });

  // Mutations
  const expenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsExpenseOpen(false);
      expenseForm.reset();
      alert('Expense logged successfully!');
    },
    onError: (err: any) => {
      alert(`Logging failed: ${err.response?.data?.error?.message || err.message}`);
    },
  });

  const fuelMutation = useMutation({
    mutationFn: createFuelLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsFuelOpen(false);
      fuelForm.reset();
      alert('Fuel log registered successfully!');
    },
    onError: (err: any) => {
      alert(`Logging failed: ${err.response?.data?.error?.message || err.message}`);
    },
  });

  const handleExpenseSubmit = (values: ExpenseFormValues) => {
    expenseMutation.mutate(values);
  };

  const handleFuelSubmit = (values: FuelFormValues) => {
    fuelMutation.mutate(values);
  };

  const vehiclesOptions = (vehiclesData?.data?.vehicles || []).map((v) => ({
    label: `${v.registrationNumber} - ${v.name}`,
    value: v._id,
  }));

  const expenseTypeOptions = [
    { label: 'TOLL', value: 'TOLL' },
    { label: 'MAINTENANCE', value: 'MAINTENANCE' },
    { label: 'REPAIR', value: 'REPAIR' },
    { label: 'FUEL', value: 'FUEL' },
    { label: 'OTHER', value: 'OTHER' },
  ];

  // Table Columns
  const expenseColumns = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (e: Expense) => e.vehicleId?.registrationNumber || 'N/A',
    },
    { key: 'type', header: 'Expense Type' },
    { key: 'amount', header: 'Amount', render: (e: Expense) => `$${e.amount}` },
    { key: 'description', header: 'Description' },
    {
      key: 'date',
      header: 'Date',
      render: (e: Expense) => new Date(e.date).toLocaleDateString(),
    },
    {
      key: 'createdBy',
      header: 'Logged By',
      render: (e: Expense) => e.createdBy?.name || 'System',
    },
  ];

  const fuelColumns = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (f: FuelLog) => f.vehicleId?.registrationNumber || 'N/A',
    },
    { key: 'liters', header: 'Fuel Liters', render: (f: FuelLog) => `${f.liters} L` },
    { key: 'cost', header: 'Cost', render: (f: FuelLog) => `$${f.cost}` },
    { key: 'odometer', header: 'Odometer (KM)', render: (f: FuelLog) => `${f.odometer} km` },
    {
      key: 'date',
      header: 'Refuel Date',
      render: (f: FuelLog) => new Date(f.date).toLocaleDateString(),
    },
    {
      key: 'createdBy',
      header: 'Logged By',
      render: (f: FuelLog) => f.createdBy?.name || 'System',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Operating Expenses Ledger</h2>
          <p className="text-muted-foreground">Log refuels and operational cash disbursements. Tracks financial cost structures.</p>
        </div>
        <div className="flex items-center gap-2">
          {isDispatcherOrAbove && (
            <Button variant="outline" onClick={() => setIsFuelOpen(true)}>
              Log Refuel
            </Button>
          )}
          {isFinanceOrAdmin && (
            <Button onClick={() => setIsExpenseOpen(true)}>
              Log Expense
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border">
        <button
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'expenses'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('expenses')}
        >
          General Expenses
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'fuel'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('fuel')}
        >
          Refuel Logs
        </button>
      </div>

      {activeTab === 'expenses' ? (
        <DataTable
          columns={expenseColumns as any}
          data={expensesData?.data || []}
          isLoading={isExpensesLoading}
          pageSize={10}
        />
      ) : (
        <DataTable
          columns={fuelColumns as any}
          data={fuelLogsData?.data || []}
          isLoading={isFuelLoading}
          pageSize={10}
        />
      )}

      {/* Log Expense Sheet */}
      <Sheet open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold">Record Operations Expense</h3>
            <p className="text-sm text-muted-foreground">Record operational outlays such as repairs, highway tolls, or servicing charges.</p>
          </div>
          <form className="space-y-4 py-4" onSubmit={expenseForm.handleSubmit(handleExpenseSubmit as any)}>
            <FormField
              control={expenseForm.control as any}
              name="vehicleId"
              label="Select Target Vehicle"
              type="select"
              options={vehiclesOptions}
              placeholder="Select vehicle"
              required
            />
            <FormField
              control={expenseForm.control as any}
              name="type"
              label="Expense Classification Type"
              type="select"
              options={expenseTypeOptions}
              placeholder="Select type"
              required
            />
            <FormField control={expenseForm.control as any} name="amount" label="Cost Amount ($)" type="number" required />
            <FormField control={expenseForm.control as any} name="description" label="Detailed Invoice Description" placeholder="e.g. Toll charges Detroit bridge" required />
            <FormField control={expenseForm.control as any} name="date" label="Transaction Date" type="date" required />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsExpenseOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={expenseMutation.isPending}>
                Save Expense
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Log Fuel Log Sheet */}
      <Sheet open={isFuelOpen} onOpenChange={setIsFuelOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold">Log Refuel Action</h3>
            <p className="text-sm text-muted-foreground">Log vehicle refuel details including liters, odometer readings, and cash cost.</p>
          </div>
          <form className="space-y-4 py-4" onSubmit={fuelForm.handleSubmit(handleFuelSubmit as any)}>
            <FormField
              control={fuelForm.control as any}
              name="vehicleId"
              label="Select Vehicle"
              type="select"
              options={vehiclesOptions}
              placeholder="Select vehicle"
              required
            />
            <FormField control={fuelForm.control as any} name="liters" label="Fuel Liters (L)" type="number" required />
            <FormField control={fuelForm.control as any} name="cost" label="Total Refuel Cost ($)" type="number" required />
            <FormField control={fuelForm.control as any} name="odometer" label="Vehicle Odometer at Refuel (KM)" type="number" required />
            <FormField control={fuelForm.control as any} name="date" label="Refuel Date" type="date" required />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFuelOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={fuelMutation.isPending}>
                Save Refuel Log
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
