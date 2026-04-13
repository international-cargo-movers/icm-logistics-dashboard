"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from 'react-hook-form'
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Link as LinkIcon, XCircle } from "lucide-react"

import { Form } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import Header from "@/components/dashboard/new-job/header"
import CustomerSection from "@/components/dashboard/new-job/customer-section"
import PartiesSection from "@/components/dashboard/new-job/parties-section"
import RoutingSection from "@/components/dashboard/new-job/routing-section"
import CargoSection from "@/components/dashboard/new-job/cargo-section"
import VendorSection from "@/components/dashboard/new-job/vendor-section"
import DocumentsSection from "@/components/dashboard/new-job/document-section"

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
})

export type JobFormValues = z.infer<typeof jobFormSchema>

// Define our absolute baseline for wiping the form
const defaultFormValues = {
  quoteReference: "",
  customerDetails: { companyId: "", salesPerson: "", taxId: "", streetAddress: "", city: "", state: "", zipCode: "", country: "" },
  partyDetails: { shipperId: "", consigneeId: "", notifyPartyId: "", overseasAgentId: "" },
  shipmentDetails: { mode: "", originCountry: "", originPort: "", destinationCountry: "", destinationPort: "" },
  cargoDetails: { commodity: "", packageCount: 0, grossWeight: "", netWeight: "", dimensions: "", etd: undefined, eta: undefined },
  vendorDetails: [],
};

export default function NewJobPage() {
  const router = useRouter();
  const [approvedQuotes, setApprovedQuotes] = useState<any[]>([]);
  const [openQuoteBox, setOpenQuoteBox] = useState(false);
  const [isLinked, setIsLinked] = useState(false); 

  const form = useForm<z.infer<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: defaultFormValues,
  })

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

  // --- 1. THE "NONE" MASTER RESET ---
  const handleClearQuote = () => {
    form.reset(defaultFormValues);
    setIsLinked(false);
    setOpenQuoteBox(false);
  }

  // --- 2. THE WIPE & REPLACE ENGINE ---
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

    // We merge the Quote data directly on top of `defaultFormValues`, 
    // ensuring we don't accidentally keep data from a previously selected quote!
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
        grossWeight: cleanWeight || "",
      }
    });

    setIsLinked(true); 
    setOpenQuoteBox(false);
  }

  async function onSubmit(values: z.infer<typeof jobFormSchema>) {
    try {
      const resolveCompanyId = async (inputNameOrId: string | undefined, fallbackType: string, extraData: any = {}) => {
        if (!inputNameOrId || inputNameOrId.trim() === "") return undefined;
        if (/^[0-9a-fA-F]{24}$/.test(inputNameOrId)) return inputNameOrId;

        const res = await fetch("/api/companies");
        const json = await res.json();
        const existingCompany = json.data?.find((c: any) => c.name.toLowerCase() === inputNameOrId.toLowerCase());

        if (existingCompany) return existingCompany._id;

        const createRes = await fetch("/api/companies", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: inputNameOrId, type: [fallbackType], ...extraData }),
        });

        const createJson = await createRes.json();
        if (createRes.ok) return createJson.data._id;
        throw new Error(createJson.error || `Failed to create new ${fallbackType}`);
      };

      const finalCompanyId = await resolveCompanyId(values.customerDetails.companyId, "Customer");
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

      const finalJobPayload = {
        ...values,
        customerDetails: { ...values.customerDetails, companyId: finalCompanyId },
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
          noOfPackages: values.cargoDetails.packageCount,
          grossWeight: values.cargoDetails.grossWeight,
          netWeight: values.cargoDetails.netWeight,  
          dimensions: values.cargoDetails.dimensions, 
          etd: values.cargoDetails.etd,
          eta: values.cargoDetails.eta
        },
        vendorDetails: finalVendorDetails
      };

      const response = await fetch('/api/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalJobPayload),
      });

      if (response.ok) {
        router.push("/dashboard");
      } else {
        console.error("Backend refused the job.");
      }
    } catch (error: any) { console.error("Network error submitting form:", error); }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.error("ZOD BLOCKED", errors))} className="flex flex-col h-screen bg-surface text-on-surface">
        <Header />

        <div className="flex-1 overflow-y-auto p-8 lg:p-14 space-y-10">
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
                        
                        {/* THE NEW RESET BUTTON */}
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