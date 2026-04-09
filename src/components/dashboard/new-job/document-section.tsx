import { Card } from "../../ui/card"
import { Upload } from "lucide-react"

export default function DocumentsSection() {
  return (
    <section>
      <h2 className="section-title">Document Uploads</h2>

      <div className="grid md:grid-cols-3 gap-6">
        <UploadBox title="e-Sanchit" />
        <UploadBox title="Bill of Lading" />
        <UploadBox title="Sea Waybill" />
      </div>
    </section>
  )
}

function UploadBox({ title }: { title: string }) {
  return (
    <Card className="p-6 border-dashed flex flex-col items-center text-center">
      <Upload className="mb-3" />
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">Click or drag file</p>
    </Card>
  )
}