import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormSelect, type FormSelectOption } from '@/components/common/FormSelect'

type FormFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  type?: 'text' | 'number' | 'email' | 'password' | 'date' | 'textarea' | 'select'
  placeholder?: string
  required?: boolean
  options?: FormSelectOption[]
}

export function FormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  options = [],
}: FormFieldProps<TFieldValues>) {
  if (type === 'select') {
    return (
      <FormSelect
        control={control}
        name={name}
        label={label}
        placeholder={placeholder}
        required={required}
        options={options}
      />
    )
  }

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
            {type === 'textarea' ? (
              <Textarea
                id={name}
                placeholder={placeholder}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            ) : (
              <Input
                id={name}
                type={type}
                placeholder={placeholder}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
            {fieldState.error ? <p className="text-caption text-danger">{fieldState.error.message}</p> : null}
          </div>
        )}
      />
    </div>
  )
}
