"use client"

import * as React from "react"
import { Controller, FormProvider, useFormContext } from "react-hook-form"

export const Form = FormProvider

export function FormField({ ...props }: any) {
  return <Controller {...props} />
}

export function FormItem({ children }: any) {
  return <div className="space-y-2">{children}</div>
}

export function FormLabel({ children }: any) {
  return <label className="text-sm font-medium">{children}</label>
}

export function FormControl({ children }: any) {
  return <div>{children}</div>
}

export function FormMessage({ children }: any) {
  return <p className="text-sm text-red-500">{children}</p>
}