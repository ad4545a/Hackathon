import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getMaintenance, startMaintenance, completeMaintenance } from '@/api/maintenance.api';
import type { MaintenanceLog } from '@/api/maintenance.api';
import { getVehicles } from '@/api/vehicles.api';
import { useAuth } from '@/hooks/use-auth';
import { DataTable } from '@/components/common/DataTable';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

const startFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  maintenanceType: z.string().min(1, 'Maintenance type is required'),
  description: z.string().min(1, 'Description is required'),
  cost: z.coerce.number().nonnegative('Cost must be positive'),
});

type StartFormValues = z.infer<typeof startFormSchema>;

const completeFormSchema = z.object({
  cost: z.coerce.number().nonnegative('Cost must be positive'),
  retireVehicle: z.boolean().default(false),
});

type CompleteFormValues = z.infer<typeof completeFormSchema>;

export function MaintenancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isFleetManager = user?.role === 'FLEET_MANAGER';

  // Sheet State
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [completingLog, setCompletingLog] = useState<MaintenanceLog | null>(null);

  const startForm = useForm<StartFormValues>({
    resolver: zodResolver(startFormSchema) as any,
    defaultValues: {
      vehicleId: '',
      maintenanceType: '',
      description: '',
      cost: 0,
    },
  });

  const completeForm = useForm<CompleteFormValues>({
    resolver: zodResolver(completeFormSchema) as any,
    defaultValues: {
      cost: 0,
      retireVehicle: false,
    },
  });

  // Queries
  const { data: logsData, isLoading, error } = useQuery({
    queryKey: ['maintenance'],
    queryFn: getMaintenance,
  });

  // Query vehicles with status AVAILABLE to select
  const { data: availableVehiclesData } = useQuery({
    queryKey: ['available-vehicles-maintenance'],
    queryFn: () => getVehicles({ status: 'AVAILABLE', limit: 100 }),
    enabled: isStartOpen,
  });

  // Mutations
  const startMutation = useMutation({
    mutationFn: startMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsStartOpen(false);
      startForm.reset();
      alert('Maintenance session started. Vehicle status updated to IN_SHOP.');
    },
    onError: (err: any) => {
      alert(`Operation failed: ${err.response?.data?.error?.message || err.message}`);
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setCompletingLog(null);
      completeForm.reset();
      alert('Maintenance completed successfully!');
    },
    onError: (err: any) => {
      alert(`Operation failed: ${err.response?.data?.error?.message || err.message}`);
    },
  });

  const handleStartSubmit = (values: StartFormValues) => {
    startMutation.mutate(values);
  };

  const handleCompleteSubmit = (values: CompleteFormValues) => {
    if (completingLog) {
      completeMutation.mutate({ id: completingLog._id, data: values });
    }
  };

  const handleOpenComplete = (log: MaintenanceLog) => {
    setCompletingLog(log);
    completeForm.reset({
      cost: log.cost,
      retireVehicle: false,
    });
  };

  const availableVehiclesOptions = (availableVehiclesData?.data?.vehicles || []).map((v) => ({
    label: `${v.registrationNumber} - ${v.name}`,
    value: v._id,
  }));

  const columns = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (m: MaintenanceLog) => (
        <div>
          <p className="font-medium text-foreground">{m.vehicleId?.name || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{m.vehicleId?.registrationNumber || 'N/A'}</p>
        </div>
      ),
    },
    { key: 'maintenanceType', header: 'Type' },
    { key: 'description', header: 'Description' },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (m: MaintenanceLog) => new Date(m.startDate).toLocaleDateString(),
    },
    {
      key: 'completionDate',
      header: 'End Date',
      render: (m: MaintenanceLog) => (m.completionDate ? new Date(m.completionDate).toLocaleDateString() : '—'),
    },
    { key: 'cost', header: 'Cost', render: (m: MaintenanceLog) => `$${m.cost}` },
    {
      key: 'status',
      header: 'Status',
      render: (m: MaintenanceLog) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
        if (m.status === 'ACTIVE') variant = 'warning';
        else if (m.status === 'COMPLETED') variant = 'success';
        else if (m.status === 'CANCELLED') variant = 'neutral';

        return <Badge variant={variant}>{m.status}</Badge>;
      },
    },
  ];

  const actions = (row: MaintenanceLog) => {
    if (!isFleetManager || row.status !== 'ACTIVE') return null;
    return (
      <Button variant="secondary" size="sm" onClick={() => handleOpenComplete(row)}>
        Complete
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Maintenance Logs</h2>
          <p className="text-muted-foreground">Track vehicle maintenance schedules, repairs, shop logs, and servicing charges.</p>
        </div>
        {isFleetManager && <Button onClick={() => setIsStartOpen(true)}>Start Maintenance</Button>}
      </div>

      {error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          Failed to fetch maintenance logs from database.
        </div>
      ) : (
        <DataTable
          columns={columns as any}
          data={logsData?.data || []}
          isLoading={isLoading}
          pageSize={10}
          actions={actions as any}
        />
      )}

      {/* Start Maintenance Sheet */}
      <Sheet open={isStartOpen} onOpenChange={setIsStartOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold">Record Shop Entry</h3>
            <p className="text-sm text-muted-foreground">Send vehicle to maintenance shop. Updates vehicle status to IN_SHOP.</p>
          </div>
          <form className="space-y-4 py-4" onSubmit={startForm.handleSubmit(handleStartSubmit as any)}>
            <FormField
              control={startForm.control as any}
              name="vehicleId"
              label="Select Vehicle (AVAILABLE)"
              type="select"
              options={availableVehiclesOptions}
              placeholder="Select vehicle"
              required
            />
            <FormField control={startForm.control as any} name="maintenanceType" label="Maintenance Type" placeholder="e.g. Engine Check / Brake Pads" required />
            <FormField control={startForm.control as any} name="description" label="Detailed Description" type="textarea" placeholder="Describe issues..." required />
            <FormField control={startForm.control as any} name="cost" label="Estimated Cost ($)" type="number" required />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsStartOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={startMutation.isPending}>
                Start Session
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Complete Maintenance Sheet */}
      <Sheet open={!!completingLog} onOpenChange={(open) => !open && setCompletingLog(null)}>
        <SheetContent className="sm:max-w-md">
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold">Record Shop Exit</h3>
            <p className="text-sm text-muted-foreground">Close shop ticket. Restores vehicle status to AVAILABLE (or RETIRED if specified).</p>
          </div>
          <form className="space-y-4 py-4" onSubmit={completeForm.handleSubmit(handleCompleteSubmit as any)}>
            <div className="rounded-md bg-muted p-3 text-xs space-y-1">
              <p>
                <span className="font-semibold">Vehicle: </span>
                {completingLog?.vehicleId?.name} ({completingLog?.vehicleId?.registrationNumber})
              </p>
              <p>
                <span className="font-semibold">Type: </span>
                {completingLog?.maintenanceType}
              </p>
            </div>
            <FormField control={completeForm.control as any} name="cost" label="Actual Cost Incurred ($)" type="number" required />

            <div className="flex items-center gap-2 pt-2">
              <input
                id="retireVehicle"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                {...completeForm.register('retireVehicle')}
              />
              <Label htmlFor="retireVehicle">Retire vehicle immediately upon completion</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCompletingLog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={completeMutation.isPending}>
                Finish Maintenance
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
