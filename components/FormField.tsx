"use client"

import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Control, Controller, FieldValues, Path } from "react-hook-form"

//formfield component will be receiving the custom field's props and so defining a type of these set of props together in an interface FormFieldProps
interface FormFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    label: string;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'file';
}
const FormField = ({ control, name, label, placeholder, type="text" }: FormFieldProps<T>) => (
    // to make the form field component so much more re-usable we will be using the controller component from react-hook-form instead of FormField component
    // cuz we will be passing the control for each field to this component, so controller component will be much better
    <Controller
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel className="label">{label}</FormLabel>
                <FormControl>
                    <Input placeholder={placeholder} {...field} className="input" type={type}/>
                </FormControl>
                <FormMessage/>
            </FormItem>
        )}
    />
)

export default FormField
