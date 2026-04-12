import { notFound } from "next/navigation"
import Link from "next/link"
import JobModel from "@/model/JobModel"
import dbConnect from "@/lib/mongodb"
import "@/model/CompanyModel"
import StatusDropdown from "@/components/dashboard/jobs/StatusDropdown"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Truck, Anchor, Plane, MapPin, Package, Building2 } from "lucide-react"

// Server Component
export default async function JobControlRoom({ params }: { params: { jobId: string } }) {
    await dbConnect();
    const { jobId } = await params;

    // UPDATED: Now populating all the new granular fields from the Company as a fallback
    const job = await JobModel.findOne({ jobId: jobId })
        .populate("customerDetails.companyId", "name taxId streetAddress city state zipCode country defaultSalesPerson")
        .populate("vendorDetails.vendorId", "name")
        .lean()

    if (!job) {
        return notFound()
    }

    const ModeIcon = job.shipmentDetails?.mode.toLowerCase() === "air" ? Plane
        : job.shipmentDetails?.mode.toLowerCase() === "sea" ? Anchor
            : Truck;

    return (
        <div className="bg-surface text-on-background min-h-screen p-8 lg:p-12">
            {/* Header */}
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/dashboard">
                        <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-primary mb-2">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back To Dashboard
                        </Button>
                    </Link>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-extrabold text-primary tracking-tight">
                            {job.jobId}
                        </h1>

                        {/* THE NEW BADGES */}
                        <div className="flex items-center gap-2 mt-1">
                            {/* Job Type Badge - Auto capitalizes and fixes old underscores! */}
                            <Badge className="text-sm px-4 py-1 bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none capitalize">
                                {job.shipmentDetails?.mode?.replace(/_/g, ' ') || "Unknown Mode"}
                            </Badge>

                            {/* Status Badge */}
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

                {/* LEFT COLUMN (Customer & Routing) */}
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

                </div>

                {/* RIGHT COLUMN (Entities) */}
                <div className="space-y-8">

                    {/* UPDATED: Structured Customer Card */}
                    <Card className="p-6 border border-border shadow-sm border-t-4 border-t-primary">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-6 pb-4 border-b">
                            <Building2 className="text-primary" /> The Client
                        </h2>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg font-bold text-lg shrink-0">
                                {job.customerDetails?.companyId?.name?.substring(0, 2).toUpperCase() || "??"}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-foreground text-lg truncate" title={job.customerDetails?.companyId?.name}>
                                    {job.customerDetails?.companyId?.name || "Unknown Company"}
                                </h3>
                                <p className="text-sm text-muted-foreground truncate">
                                    Tax ID: <span className="font-mono text-primary font-medium">{job.customerDetails?.taxId || job.customerDetails?.companyId?.taxId || "N/A"}</span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Street Address</p>
                                <p className="text-sm font-medium text-foreground leading-snug">
                                    {job.customerDetails?.streetAddress || job.customerDetails?.companyId?.streetAddress || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">City</p>
                                {/* Removed 'truncate', added 'leading-snug' for clean wrapping */}
                                <p className="text-sm font-medium text-foreground leading-snug">
                                    {job.customerDetails?.city || job.customerDetails?.companyId?.city || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">State / Prov</p>
                                <p className="text-sm font-medium text-foreground leading-snug">
                                    {job.customerDetails?.state || job.customerDetails?.companyId?.state || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Zip Code</p>
                                <p className="text-sm font-medium text-foreground leading-snug">
                                    {job.customerDetails?.zipCode || job.customerDetails?.companyId?.zipCode || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Country</p>
                                <p className="text-sm font-medium text-foreground leading-snug">
                                    {job.customerDetails?.country || job.customerDetails?.companyId?.country || "—"}
                                </p>
                            </div>

                            <div className="col-span-2 mt-1 pt-5 border-t">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Sales Person</p>
                                <p className="text-sm font-medium text-foreground">
                                    {job.customerDetails?.salesPerson || job.customerDetails?.companyId?.defaultSalesPerson || "—"}
                                </p>
                            </div>
                        </div>
                    </Card>

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