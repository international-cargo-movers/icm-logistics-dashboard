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
    const {jobId} = await params;
    const job = await JobModel.findOne({ jobId:jobId })
        .populate("customerDetails.companyId", "name billingAddress defaultSalesPerson")
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
                        <Badge variant="outline" className="text-sm px-4 py-1 border-primary text-primary">
                            {job.cargoDetails?.jobStatus || "Processing"}
                        </Badge>
                    </div>
                </div>
                <div className="flex gap-3">
                    {/* We will build this in Step 3! */}
                    <StatusDropdown
                        jobId={job.jobId}
                        currentStatus={job.cargoDetails?.jobStatus||"Processing"}
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

                    {/* Customer Card */}
                    <Card className="p-6 border-l-4 border-l-primary">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <Building2 className="text-primary" /> The Client
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Company Name</p>
                                <p className="font-bold text-lg">{job.customerDetails?.companyId?.name || "Unknown"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Sales Rep</p>
                                <p className="font-semibold">{job.customerDetails?.companyId?.defaultSalesPerson || "Unassigned"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Billing Address</p>
                                <p className="text-sm mt-1">{job.customerDetails?.companyId?.billingAddress || "No address on file."}</p>
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