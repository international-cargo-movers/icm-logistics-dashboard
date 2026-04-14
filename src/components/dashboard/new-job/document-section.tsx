"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { UploadCloud, FileText, X, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { JobFormValues } from "@/app/dashboard/new-job/page" // Adjust path if needed!

export default function DocumentsSection() {
  const { watch, setValue } = useFormContext<JobFormValues>()
  const [isUploading, setIsUploading] = React.useState(false)
  
  // Watch the current documents array in our form state
  const currentDocs = watch("documents") || []

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Quick size check (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 10MB.")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      // 1. Send file to our Cloudinary Bouncer API
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()

      if (json.success) {
        // 2. Add the secure URL to our React Hook Form state
        setValue("documents", [
          ...currentDocs,
          {
            fileName: json.originalName,
            fileUrl: json.url,
            format: json.format || "pdf",
          }
        ], { shouldValidate: true })
        
        toast.success("Document attached securely!")
      } else {
        throw new Error(json.error || "Upload failed")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUploading(false)
      // Clear the input so you can upload the same file again if needed
      e.target.value = ""
    }
  }

  const removeDocument = (indexToRemove: number) => {
    const newDocs = currentDocs.filter((_, idx) => idx !== indexToRemove)
    setValue("documents", newDocs, { shouldValidate: true })
  }

  return (
    <section className="space-y-6 pt-6 border-t border-slate-200">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900">Document Vault</h2>
        <p className="text-sm text-slate-500">Attach Bills of Lading, e-Sanchit, and Commercial Invoices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* DRAG & DROP ZONE */}
        <div className="relative">
          <input 
            type="file" 
            onChange={handleFileUpload} 
            disabled={isUploading}
            accept=".pdf,.jpg,.jpeg,.png,.xlsx"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" 
          />
          <div className={`h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all ${isUploading ? 'bg-slate-50 border-slate-300' : 'bg-blue-50/50 border-blue-200 hover:bg-blue-50 hover:border-blue-400'}`}>
            {isUploading ? (
              <div className="flex flex-col items-center text-slate-500">
                <Loader2 className="w-8 h-8 mb-3 animate-spin text-blue-500" />
                <span className="font-semibold text-sm">Encrypting & Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-blue-600">
                <UploadCloud className="w-10 h-10 mb-3 text-blue-400" />
                <span className="font-bold">Click or Drag Files Here</span>
                <span className="text-xs text-slate-500 mt-1">PDF, JPG, PNG (Max 10MB)</span>
              </div>
            )}
          </div>
        </div>

        {/* ATTACHED FILES LIST */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 overflow-y-auto max-h-40">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Attached to Job ({currentDocs.length})</h3>
          
          {currentDocs.length === 0 ? (
            <div className="text-sm text-slate-400 italic text-center py-4">No documents attached yet.</div>
          ) : (
            <div className="space-y-3">
              {currentDocs.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-700 truncate hover:text-blue-600 transition-colors">
                      {doc.fileName}
                    </a>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeDocument(idx)}
                    className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  )
}