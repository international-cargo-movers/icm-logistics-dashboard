"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from 'react-hook-form'
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Link as LinkIcon, Shield, XCircle } from "lucide-react"

import { Form } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"

import Header from "@/components/dashboard/new-job/header"
import CustomerSection from "@/components/dashboard/new-job/customer-section"
import PartiesSection from "@/components/dashboard/new-job/parties-section"
import RoutingSection from "@/components/dashboard/new-job/routing-section"
import CargoSection from "@/components/dashboard/new-job/cargo-section"
import VendorSection from "@/components/dashboard/new-job/vendor-section"
import DocumentsSection from "@/components/dashboard/new-job/document-section"
import { useSession } from "next-auth/react"

export const jobFormSchema = z.object({
  quoteReference: z.string().optional(),
  customerDetails: z.object({
    companyId: z.string().min(1, { message: "Please select a company." }),
    salesPerson: z.string().optional(),
    taxId: z.string().optional(),
    streetAddress: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }),
  partyDetails: z.object({
    shipperId: z.string().optional(),
    consigneeId: z.string().optional(),
    notifyPartyId: z.string().optional(),
    overseasAgentId: z.string().optional()
  }).optional(),
  shipmentDetails: z.object({
    mode: z.string({ error: "Transport mode is required" }),
    originCountry: z.string().optional(),
    originPort: z.string().optional(),
    destinationCountry: z.string().optional(),
    destinationPort: z.string().optional(),
  }),
  cargoDetails: z.object({
    commodity: z.string().optional(),
    containerCount: z.coerce.number().optional(),
    containerType: z.string().optional(),
    totalCBM: z.coerce.number().optional(),
    carrier: z.string().optional(),
    items: z.array(z.object({
      description: z.string().optional(),
      hsnCode: z.string().optional(),
      noOfPackages: z.coerce.number().optional(),
      grossWeight: z.coerce.number().optional(),
      netWeight: z.coerce.number().optional(),
      volumetricWeight: z.coerce.number().optional(),
      dimensions: z.string().optional(),
    })).optional(),
    packageCount: z.coerce.number().optional(),
    grossWeight: z.string().optional(),
    netWeight: z.string().optional(),
    dimensions: z.string().optional(),
    etd: z.date().optional(),
    eta: z.date().optional(),
  }),
  vendorDetails: z.array(
    z.object({ vendorId: z.string(), vendorType: z.string() })
  ).optional(),
  documents: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    format: z.string().optional(),
  })).default([]),
})

export type JobFormValues = z.infer<typeof jobFormSchema>

const defaultFormValues = {
  quoteReference: "",
  customerDetails: { companyId: "", salesPerson: "", taxId: "", streetAddress: "", city: "", state: "", zipCode: "", country: "" },
  partyDetails: { shipperId: "", consigneeId: "", notifyPartyId: "", overseasAgentId: "" },
  shipmentDetails: { mode: "", originCountry: "", originPort: "", destinationCountry: "", destinationPort: "" },
  cargoDetails: { 
    commodity: "", 
    containerCount: 1,
    containerType: "20' GP",
    totalCBM: 0,
    carrier: "",
    items: [{ description: "", hsnCode: "", noOfPackages: 0, grossWeight: 0, netWeight: 0, volumetricWeight: 0, dimensions: "" }],
    packageCount: 0, 
    grossWeight: "", 
    netWeight: "", 
    dimensions: "", 
    etd: undefined, 
    eta: undefined 
  },
  vendorDetails: [],
  documents: [],
};

export default function NewJobPage() {
  const { data: session, status } = useSession()
  const router = useRouter();
  const [approvedQuotes, setApprovedQuotes] = useState<any[]>([]);
  const [openQuoteBox, setOpenQuoteBox] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);

  const form = useForm<z.infer<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema) as any,
    defaultValues: defaultFormValues,
  })

  useEffect(() => {
  async function fetchCompanies() {
    try {
      const res = await fetch("/api/companies");
      const json = await res.json();
      if (json.success) setCompanies(json.data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  }
  fetchCompanies();
}, []);
  useEffect(() => {
    async function fetchQuotes() {
      try {
        const res = await fetch("/api/quotes");
        const json = await res.json();
        if (json.success) setApprovedQuotes(json.data.filter((q: any) => q.status === "Approved"));
      } catch (error) { console.error("Failed to fetch quotes:", error); }
    }
    fetchQuotes();
  }, []);

  const handleClearQuote = () => {
    form.reset(defaultFormValues);
    setIsLinked(false);
    setOpenQuoteBox(false);
  }

  const handleLinkQuote = async (quote: any) => {
    let fullCompany = null;
    const compId = quote.customerDetails?.companyId?._id || quote.customerDetails?.companyId;

    if (compId) {
      try {
        const res = await fetch("/api/companies");
        const json = await res.json();
        fullCompany = json.data?.find((c: any) => c._id === compId);
      } catch (error) { console.error("Failed to fetch full company details", error); }
    }

    const cleanWeight = quote.cargoSummary?.estimatedWeight ? quote.cargoSummary.estimatedWeight.replace(/[^0-9.]/g, '') : "";
    
    // Determine cargo items from quote
    const quoteItems = quote.cargoSummary?.items?.length > 0 
      ? quote.cargoSummary.items.map((item: any) => ({
          description: item.description || "",
          hsnCode: item.hsnCode || "",
          noOfPackages: Number(item.noOfPackages) || 0,
          grossWeight: Number(item.grossWeight) || 0,
          netWeight: Number(item.netWeight) || 0,
          volumetricWeight: Number(item.volumetricWeight) || 0,
          dimensions: item.dimensions || "",
        }))
      : [{ 
          description: quote.cargoSummary?.commodity || "", 
          hsnCode: "",
          noOfPackages: 0, 
          grossWeight: Number(cleanWeight) || 0, 
          netWeight: 0, 
          volumetricWeight: 0, 
          dimensions: "" 
        }];

    form.reset({
      ...defaultFormValues,
      quoteReference: quote.quoteId,
      customerDetails: {
        ...defaultFormValues.customerDetails,
        companyId: compId || "",
        salesPerson: fullCompany?.defaultSalesPerson || "",
        taxId: fullCompany?.taxId || "",
        streetAddress: fullCompany?.streetAddress || "",
        city: fullCompany?.city || "",
        state: fullCompany?.state || "",
        zipCode: fullCompany?.zipCode || "",
        country: fullCompany?.country || "",
      },
      shipmentDetails: {
        ...defaultFormValues.shipmentDetails,
        mode: quote.routingDetails?.mode || "",
        originCountry: quote.routingDetails?.originCountry || "",
        originPort: quote.routingDetails?.originPort || "",
        destinationCountry: quote.routingDetails?.destinationCountry || "",
        destinationPort: quote.routingDetails?.destinationPort || "",
      },
      cargoDetails: {
        ...defaultFormValues.cargoDetails,
        commodity: quote.cargoSummary?.commodity || "",
        containerCount: quote.cargoSummary?.containerCount || 1,
        containerType: quote.cargoSummary?.containerType || "20' GP",
        totalCBM: quote.cargoSummary?.totalCBM || 0,
        items: quoteItems,
        grossWeight: cleanWeight || "",
      }
    });

    setIsLinked(true);
    setOpenQuoteBox(false);
  }

  async function onSubmit(values: z.infer<typeof jobFormSchema>) {
    try {
      // toast.loading("Syncing CRM and creating Job...");

      const resolveCompanyId = async (inputNameOrId: string | undefined, fallbackType: string, extraData: any = {}) => {
        if (!inputNameOrId || inputNameOrId.trim() === "") return undefined;

        const cleanData = Object.fromEntries(Object.entries(extraData).filter(([_, v]) => v != null && v !== ""));

        // 1. Check if it's already a valid MongoDB ID
        if (/^[0-9a-fA-F]{24}$/.test(inputNameOrId)) {
          if (Object.keys(cleanData).length > 0) {
            const putRes = await fetch(`/api/companies/${inputNameOrId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(cleanData)
            });
            if (!putRes.ok) {
              const errJson = await putRes.json();
              throw new Error(`CRM Update Failed: ${errJson.error}`);
            }
          }
          return inputNameOrId;
        }

        // 2. NEW: Check if this name already exists in our fetched companies list
        // This prevents the duplicate key error
        const existingCompany = companies.find(
          (c:any) => c.name.toLowerCase() === inputNameOrId.trim().toLowerCase()
        );

        if (existingCompany) {
          // If it exists, update it instead of creating it
          await fetch(`/api/companies/${existingCompany._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cleanData)
          });
          return existingCompany._id;
        }

        // 3. If it's truly new, then create it
        const createRes = await fetch("/api/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: inputNameOrId, type: [fallbackType], ...cleanData }),
        });

        const createJson = await createRes.json();
        if (createRes.ok) return createJson.data._id;
        throw new Error(createJson.error || `Failed to create new ${fallbackType}`);
      };

      const customerExtraData = {
        defaultSalesPerson: values.customerDetails.salesPerson,
        taxId: values.customerDetails.taxId,
        streetAddress: values.customerDetails.streetAddress,
        city: values.customerDetails.city,
        state: values.customerDetails.state,
        zipCode: values.customerDetails.zipCode,
        country: values.customerDetails.country
      };

      const finalCompanyId = await resolveCompanyId(values.customerDetails.companyId, "Customer", customerExtraData);
      const finalShipperId = await resolveCompanyId(values.partyDetails?.shipperId, "Shipper");
      const finalConsigneeId = await resolveCompanyId(values.partyDetails?.consigneeId, "Consignee");
      const finalNotifyPartyId = await resolveCompanyId(values.partyDetails?.notifyPartyId, "Notify Party");
      const finalOverseasAgentId = await resolveCompanyId(values.partyDetails?.overseasAgentId, "Overseas Agent");

      const finalVendorDetails = await Promise.all(
        (values.vendorDetails || []).map(async (vendor) => {
          const finalVendorId = await resolveCompanyId(vendor.vendorId, "Vendor");
          return { vendorId: finalVendorId, assignedTask: vendor.vendorType };
        })
      );

      // Calculate totals from items before sending
      const items = values.cargoDetails.items || [];
      const totalPkgs = items.reduce((sum, item) => sum + (Number(item.noOfPackages) || 0), 0);
      const totalGross = items.reduce((sum, item) => sum + (Number(item.grossWeight) || 0), 0);
      const totalNet = items.reduce((sum, item) => sum + (Number(item.netWeight) || 0), 0);
      const totalVol = items.reduce((sum, item) => sum + (Number(item.volumetricWeight) || 0), 0);

      // Compute legacy equipment string for compatibility
      let equipmentStr = "";
      if (values.shipmentDetails.mode.includes("Sea FCL")) equipmentStr = `${values.cargoDetails.containerCount}x ${values.cargoDetails.containerType}`;
      else if (values.shipmentDetails.mode.includes("Sea LCL")) equipmentStr = `${values.cargoDetails.totalCBM} CBM`;
      else equipmentStr = `${Math.max(totalGross, totalVol)} KG (Air)`;

      const finalJobPayload = {
        ...values,
        customerDetails: { companyId: finalCompanyId }, // Fully normalized
        partyDetails: {
          shipperId: finalShipperId || undefined,
          consigneeId: finalConsigneeId || undefined,
          notifyPartyId: finalNotifyPartyId || undefined,
          overseasAgentId: finalOverseasAgentId || undefined
        },
        shipmentDetails: {
          mode: values.shipmentDetails.mode,
          polCountry: values.shipmentDetails.originCountry,
          portOfLoading: values.shipmentDetails.originPort,
          podCountry: values.shipmentDetails.destinationCountry,
          portOfDischarge: values.shipmentDetails.destinationPort
        },
        cargoDetails: {
          commodity: values.cargoDetails.commodity,
          equipment: equipmentStr,
          containerCount: values.cargoDetails.containerCount,
          containerType: values.cargoDetails.containerType,
          totalCBM: values.cargoDetails.totalCBM,
          carrier: values.cargoDetails.carrier,
          items: items,
          totalNoOfPackages: totalPkgs,
          totalGrossWeight: totalGross,
          totalNetWeight: totalNet,
          totalVolumetricWeight: totalVol,
          etd: values.cargoDetails.etd,
          eta: values.cargoDetails.eta
        },
        vendorDetails: finalVendorDetails,
        documents: values.documents.map(doc => ({
          ...doc,
          uploadedBy: session?.user?.name || session?.user?.email || "System User"
        })),
      };

      const response = await fetch('/api/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalJobPayload),
      });

      if (response.ok) {
        toast.success("Job Created & CRM Synchronized!");
        router.push("/dashboard");
      } else {
        const errJson = await response.json();
        throw new Error(errJson.error || "Backend refused the job.");
      }
    } catch (error: any) {
      console.error("Network error submitting form:", error);
      toast.error(error.message || "Failed to save job");
    }
  }

  if (session && !["SuperAdmin", "Operations"].includes(session?.user?.role || "")) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <Shield className="w-16 h-16 text-red-500 mb-4 opacity-20" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Restricted Area</h1>
        <p className="text-slate-500 max-w-md">Your current role ({session.user.role}) does not have clearance to generate financial documents.</p>
        <button
          onClick={() => router.back()}
          className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.error("ZOD BLOCKED", errors))} className="flex flex-col bg-surface text-on-surface min-h-screen">
        <Header />

        <div className="p-8 lg:p-14 space-y-10">
          <div className="max-w-5xl mx-auto space-y-10">

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-center gap-6">
              <div className="h-12 w-12 bg-primary text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-primary mb-1">Link Approved Quotation</h3>
                <p className="text-sm text-on-surface-variant">Selecting a quote will automatically lock in the routing, mode, and customer details.</p>
              </div>
              <div className="w-[300px]">
                <Popover open={openQuoteBox} onOpenChange={setOpenQuoteBox}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={openQuoteBox} className="w-full justify-between bg-white border-primary/20 h-12">
                      {form.watch("quoteReference") ? form.watch("quoteReference") : "Select Approved Quote..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search by Quote ID..." />
                      <CommandList>
                        <CommandEmpty>No approved quotes found.</CommandEmpty>

                        <CommandGroup>
                          <CommandItem onSelect={handleClearQuote} className="text-error font-bold cursor-pointer">
                            <XCircle className="mr-2 h-4 w-4" /> Clear Selection (Blank Job)
                          </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />

                        <CommandGroup>
                          {approvedQuotes.map((q) => (
                            <CommandItem key={q.quoteId} value={q.quoteId} onSelect={() => handleLinkQuote(q)} className="cursor-pointer">
                              <Check className={cn("mr-2 h-4 w-4", form.watch("quoteReference") === q.quoteId ? "opacity-100 text-primary" : "opacity-0")} />
                              {q.quoteId} - {q.customerDetails?.companyId?.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <CustomerSection isReadOnly={isLinked} />
            <PartiesSection />
            <RoutingSection isReadOnly={isLinked} />
            <CargoSection isReadOnly={isLinked} />
            <VendorSection />
            <DocumentsSection />
          </div>
        </div>
      </form>
    </Form>
  )
}