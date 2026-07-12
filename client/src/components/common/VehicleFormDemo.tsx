import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/common/FormField'

const vehicleSchema = z.object({
  name: z.string().min(1, 'Vehicle name is required'),
  type: z.string().min(1, 'Vehicle type is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  status: z.string().min(1, 'Status is required'),
})

type VehicleFormValues = z.infer<typeof vehicleSchema>

type VehicleFormDemoProps = {
  onSubmit: (values: VehicleFormValues) => void
}

export function VehicleFormDemo({ onSubmit }: VehicleFormDemoProps) {
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: '',
      type: '',
      registrationNumber: '',
      status: '',
    },
  })

  const typeOptions = [
    { label: 'Bus', value: 'bus' },
    { label: 'Van', value: 'van' },
    { label: 'Truck', value: 'truck' },
  ]

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Idle', value: 'idle' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Vehicle</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField control={form.control} name="name" label="Name" placeholder="e.g. Metro Bus 24" required />
          <FormField control={form.control} name="type" label="Type" type="select" placeholder="Select vehicle type" options={typeOptions} required />
          <FormField control={form.control} name="registrationNumber" label="Registration Number" placeholder="e.g. MH12AB1234" required />
          <FormField control={form.control} name="status" label="Status" type="select" placeholder="Select status" options={statusOptions} required />
          <Button type="submit">Save vehicle</Button>
        </form>
      </CardContent>
    </Card>
  )
}
