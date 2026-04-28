import { notFound } from "next/navigation"
import Link from "next/link"
import dbConnect from "@/lib/mongodb"
import { getTenantModels } from "@/model/tenantModels"
import StatusDropdown from "@/components/dashboard/jobs/StatusDropdown"
import EntitySwitcher from "@/components/dashboard/jobs/EntitySwitcher"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Truck, Anchor, Plane, MapPin, Package, Building2, FileText, Download, ExternalLink, File as FileIcon } from "lucide-react"
import ShippingDocManager from "@/components/dashboard/shipping-docs/ShippingDocManager"

// Helper function to force Cloudinary to download the file instead of opening it
const getDownloadUrl = (url: string) => {
    if (url && url.includes('/upload/')) {
        return url.replace('/upload/', '/upload/fl_attachment/');
    }
    return url;
}

// Server Component
// Rebuild trigger
export default async function JobControlRoom({ params }: { params: { jobId: string } }) {
    await dbConnect();
    const { Job } = await getTenantModels();
    const { jobId } = await params;

    const job = await Job.findOne({ jobId: jobId })
        .populate("customerDetails.companyId", "name taxId streetAddress city state zipCode country defaultSalesPerson")
        .populate("vendorDetails.vendorId", "name taxId streetAddress city state zipCode country")
        .populate("partyDetails.shipperId","name taxId streetAddress city state zipCode country")
        .populate("partyDetails.consigneeId","name taxId streetAddress city state zipCode country")
        .populate("partyDetails.notifyPartyId","name taxId streetAddress city state zipCode country")
        .populate("partyDetails.overseasAgentId","name taxId streetAddress city state zipCode country")
        .lean()

    if (!job) {
        return notFound()
    }

    console.log("Consignee: ",job.partyDetails?.consigneeId?.name);

    const sanitizedJob = JSON.parse(JSON.stringify(job))
    const ModeIcon = job.shipmentDetails?.mode.toLowerCase() === "air export"||"air import" ? Plane
        : job.shipmentDetails?.mode.toLowerCase() === "sea fcl export"||"sea fcl import"||"sea lcl export"||"sea lcl import" ? Anchor
            : Truck;

    return (
        <div className="bg-surface text-on-background min-h-screen p-8 lg:p-12">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/dashboard">
                            <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-primary">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back To Dashboard
                            </Button>
                        </Link>
                        <span className="text-muted-foreground/30">|</span>
                        <Link href={`/dashboard/jobs/${job.jobId}/reconciliation`}>
                            <Button variant="ghost" className="text-muted-foreground hover:text-blue-600">
                                <FileText className="mr-2 h-4 w-4" /> Reconciliation
                            </Button>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-extrabold text-primary tracking-tight">
                            {job.jobId}
                        </h1>

                        <div className="flex items-center gap-2 mt-1">
                            <Badge className="text-sm px-4 py-1 bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none capitalize">
                                {job.shipmentDetails?.mode?.replace(/_/g, ' ') || "Unknown Mode"}
                            </Badge>
                            <Badge variant="outline" className="text-sm px-4 py-1 border-primary text-primary">
                                {job.cargoDetails?.jobStatus || "Processing"}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <StatusDropdown
                        jobId={job.jobId}
                        currentStatus={job.cargoDetails?.jobStatus || "Processing"}
                    />
                </div>
            </div>

            {/* CONTROL ROOM GRID */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN (Routing, Cargo, Documents) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Routing Card */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                            <MapPin className="text-primary" /> Routing Details
                        </h2>
                        <div className="flex items-center justify-between p-6 bg-muted/30 rounded-xl border">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Origin (POL)</p>
                                <p className="font-bold text-xl">{job.shipmentDetails?.portOfLoading || "TBD"}</p>
                            </div>

                            <div className="flex-1 flex items-center justify-center px-4">
                                <div className="h-[2px] w-full bg-border relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-4 py-2 border rounded-full shadow-sm text-primary">
                                        <ModeIcon className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Destination (POD)</p>
                                <p className="font-bold text-xl">{job.shipmentDetails?.portOfDischarge || "TBD"}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Cargo Details Card */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                            <Package className="text-primary" /> Cargo Specifications
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Commodity</p>
                                <p className="font-semibold">{job.cargoDetails?.commodity || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Packages</p>
                                <p className="font-semibold">{job.cargoDetails?.noOfPackages || "0"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Gross Wt.</p>
                                <p className="font-semibold">{job.cargoDetails?.grossWeight ? `${job.cargoDetails.grossWeight} kg` : "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">ETD</p>
                                <p className="font-semibold">
                                    {job.cargoDetails?.etd ? new Date(job.cargoDetails.etd).toLocaleDateString() : "TBD"}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* NEW: Document Vault Card */}
                    <Card className="p-6 border-t-4 border-t-blue-500">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <FileText className="text-blue-500" /> Attached Documents
                            </h2>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                {job.documents?.length || 0} Files
                            </Badge>
                        </div>

                        {job.documents && job.documents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {job.documents.map((doc: any, index: number) => (
                                    <div key={index} className="flex items-start gap-4 p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                                        <div className="h-10 w-10 shrink-0 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                            <FileIcon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-foreground truncate" title={doc.fileName}>
                                                {doc.fileName}
                                            </p>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                                                By {doc.uploadedBy} • {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </p>
                                            <div className="flex items-center gap-3 mt-3">
                                                {/* View Button (Opens in new tab) */}
                                                <a
                                                    href={doc.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                                                >
                                                    <ExternalLink className="h-3 w-3" /> View
                                                </a>

                                                {/* Download Button (Forces download via fl_attachment) */}
                                                <a
                                                    href={getDownloadUrl(doc.fileUrl)}
                                                    download
                                                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
                                                >
                                                    <Download className="h-3 w-3" /> Download
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed">
                                <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                                <p className="text-sm font-medium text-muted-foreground">No documents attached.</p>
                                <p className="text-xs text-muted-foreground mt-1">Update the job to upload Bills of Lading or Invoices.</p>
                            </div>
                        )}
                    </Card>
                    <ShippingDocManager job={sanitizedJob}/>
                </div>

                {/* RIGHT COLUMN (Entities) */}
                <div className="space-y-8">

                    <EntitySwitcher 
                        client={job.customerDetails} 
                        consignee={job.partyDetails?.consigneeId} 
                    />

                    {/* Vendors Card */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold mb-4">Assigned Vendors</h2>
                        {job.vendorDetails && job.vendorDetails.length > 0 ? (
                            <div className="space-y-3">
                                {job.vendorDetails.map((vendor: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-muted/40 rounded-md border">
                                        <div>
                                            <p className="font-semibold text-sm">{vendor.vendorId?.name || "Unknown Vendor"}</p>
                                            <p className="text-xs text-muted-foreground">{vendor.assignedTask || "Task Unassigned"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No vendors assigned to this job.</p>
                        )}
                    </Card>

                </div>
            </div>
        </div>
    )
}