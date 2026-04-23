import { notFound } from "next/navigation"
import Link from "next/link"
import dbConnect from "@/lib/mongodb"
import { getTenantModels } from "@/model/tenantModels"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
    ArrowLeft, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Receipt, 
    Wallet,
    Scale,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react"

export default async function ReconciliationPage({ params }: { params: { jobId: string } }) {
    await dbConnect();
    const { Job, Invoice, VendorInvoice } = await getTenantModels();
    const { jobId } = await params;

    const job = await Job.findOne({ jobId: jobId }).lean();
    if (!job) return notFound();

    // Fetch all customer invoices for this job
    const customerInvoices = await Invoice.find({ jobId: job._id }).lean();
    
    // Fetch all vendor invoices for this job
    const vendorInvoices = await VendorInvoice.find({ jobId: job._id }).lean();

    const totalReceivables = customerInvoices.reduce((sum, inv) => sum + (inv.totals?.netAmount || 0), 0);
    const totalPayables = vendorInvoices.reduce((sum, inv) => sum + (inv.totals?.netAmount || 0), 0);
    const netMargin = totalReceivables - totalPayables;
    const marginPercentage = totalReceivables > 0 ? (netMargin / totalReceivables) * 100 : 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="bg-surface text-on-background min-h-screen p-8 lg:p-12">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href={`/dashboard/jobs/${jobId}`}>
                        <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-primary mb-2">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back To Job Control
                        </Button>
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
                                <Scale className="h-8 w-8 text-blue-600" /> Financial Reconciliation
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Job Reference: <span className="font-bold text-foreground">{jobId}</span>
                            </p>
                        </div>
                        <Badge variant="outline" className="px-4 py-1 text-sm border-blue-200 bg-blue-50 text-blue-700">
                            Live Audit
                        </Badge>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6 border-l-4 border-l-emerald-500 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Receivables</p>
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-emerald-700">{formatCurrency(totalReceivables)}</h2>
                        <p className="text-xs text-muted-foreground mt-2">{customerInvoices.length} Invoices Issued</p>
                    </Card>

                    <Card className="p-6 border-l-4 border-l-rose-500 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Payables</p>
                            <div className="p-2 bg-rose-50 rounded-lg">
                                <TrendingDown className="h-5 w-5 text-rose-600" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-rose-700">{formatCurrency(totalPayables)}</h2>
                        <p className="text-xs text-muted-foreground mt-2">{vendorInvoices.length} Vendor Bills</p>
                    </Card>

                    <Card className="p-6 border-l-4 border-l-blue-600 shadow-sm bg-blue-50/30">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Net Job Margin</p>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-blue-700" />
                            </div>
                        </div>
                        <h2 className={`text-3xl font-bold ${netMargin >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                            {formatCurrency(netMargin)}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge className={netMargin >= 0 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-100 text-rose-700 hover:bg-rose-100'}>
                                {marginPercentage.toFixed(2)}% Margin
                            </Badge>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Receivables Table */}
                    <Card className="overflow-hidden border-none shadow-md">
                        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <ArrowUpRight className="h-5 w-5" /> Customer Receivables (Inflow)
                            </h3>
                        </div>
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customerInvoices.length > 0 ? customerInvoices.map((inv: any) => (
                                    <TableRow key={inv._id}>
                                        <TableCell className="font-bold">{inv.invoiceNo}</TableCell>
                                        <TableCell>{new Date(inv.invoiceDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{inv.customerDetails?.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                                                {inv.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-emerald-700">{formatCurrency(inv.totals?.netAmount)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No customer invoices found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Payables Table */}
                    <Card className="overflow-hidden border-none shadow-md">
                        <div className="bg-rose-600 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <ArrowDownRight className="h-5 w-5" /> Vendor Payables (Outflow)
                            </h3>
                        </div>
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Bill / Inv #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vendorInvoices.length > 0 ? vendorInvoices.map((inv: any) => (
                                    <TableRow key={inv._id}>
                                        <TableCell className="font-bold">{inv.vendorInvoiceNo}</TableCell>
                                        <TableCell>{new Date(inv.vendorInvoiceDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{inv.vendorDetails?.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                                                {inv.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-rose-700">{formatCurrency(inv.totals?.netAmount)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No vendor bills found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </div>
        </div>
    )
}
