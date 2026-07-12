import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type FormSelectOption = {
  label: string
  value: string
}

type FormSelectProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  options: FormSelectOption[]
  placeholder?: string
  required?: boolean
}

export function FormSelect<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = 'Select an option',
  required = false,
}: FormSelectProps<TFieldValues>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <div className="space-y-1">
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger id={name}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.error ? <p className="text-caption text-danger">{fieldState.error.message}</p> : null}
          </div>
        )}
      />
    </div>
  )
}
