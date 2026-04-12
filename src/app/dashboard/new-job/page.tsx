"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from 'react-hook-form'
import * as z from "zod"
import { useRouter } from "next/navigation"

import { Form } from "@/components/ui/form"
import Header from "@/components/dashboard/new-job/header"
import CustomerSection from "@/components/dashboard/new-job/customer-section"
import PartiesSection from "@/components/dashboard/new-job/parties-section"
import RoutingSection from "@/components/dashboard/new-job/routing-section"
import CargoSection from "@/components/dashboard/new-job/cargo-section"
import VendorSection from "@/components/dashboard/new-job/vendor-section"
import DocumentsSection from "@/components/dashboard/new-job/document-section"

// 1. UPDATED ZOD SCHEMA (Added new structured fields)
export const jobFormSchema = z.object({
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
    consigneeId: z.string().optional()
  }).optional(),
  shipmentDetails: z.object({
    mode: z.string({ error: "Transport mode is required" }),
    originPort: z.string().optional(),
    destinationPort: z.string().optional(),
  }),
  cargoDetails: z.object({
    commodity: z.string().optional(),
    packageCount: z.coerce.number().optional(), // Coerce helps with number inputs
    grossWeight: z.string().optional(),
    etd: z.date().optional(),
    eta: z.date().optional(),
  }),
  vendorDetails: z.array(
    z.object({
      vendorId: z.string(),
      vendorType: z.string()
    })
  ).optional(),
})

export type JobFormValues = z.infer<typeof jobFormSchema>

export default function NewJobPage() {
  const router = useRouter();

  // 2. UPDATED DEFAULT VALUES
  const form = useForm<z.infer<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      customerDetails: { 
        companyId: "", 
        salesPerson: "", 
        taxId: "",
        streetAddress: "",
        city: "",
        state: "",
        zipCode: "",
        country: ""
      },
      partyDetails: { shipperId: "", consigneeId: "" },
      shipmentDetails: { mode: "", originPort: "", destinationPort: "" },
      cargoDetails: { commodity: "", packageCount: 0, grossWeight: "" },
      vendorDetails: [],
    },
  })

  // 3. THE MASTER ONSUBMIT FUNCTION
  async function onSubmit(values: z.infer<typeof jobFormSchema>) {
    try {
      // --- SMART COMPANY RESOLVER HELPER ---
      // Checks if it's an ID, an empty string, an existing company, or a brand new one.
      const resolveCompanyId = async (inputNameOrId: string | undefined, fallbackType: string, extraData: any = {}) => {
        // A. Blank/Empty -> Ignore it (fixes Cast Error)
        if (!inputNameOrId || inputNameOrId.trim() === "") return undefined;

        // B. Valid Mongo ID -> Return it
        if (/^[0-9a-fA-F]{24}$/.test(inputNameOrId)) return inputNameOrId;

        // C. It's a string name. Search DB to prevent duplicates (fixes E11000 Error)
        const res = await fetch("/api/companies");
        const json = await res.json();
        const existingCompany = json.data?.find((c: any) => c.name.toLowerCase() === inputNameOrId.toLowerCase());

        if (existingCompany) {
          console.log(`Found existing ${fallbackType}: ${existingCompany.name}`);
          return existingCompany._id;
        }

        // D. It genuinely doesn't exist -> Create a new record
        console.log(`Creating new ${fallbackType}: ${inputNameOrId}`);
        const createRes = await fetch("/api/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: inputNameOrId, 
            type: [fallbackType], 
            ...extraData // Spread in extra data like taxId, city, etc.
          }),
        });
        
        const createJson = await createRes.json();
        if (createRes.ok) return createJson.data._id;
        throw new Error(createJson.error || `Failed to create new ${fallbackType}`);
      };

      // Extract extra data to pass to the Customer creation if needed
      const customerExtraData = {
        defaultSalesPerson: values.customerDetails.salesPerson,
        taxId: values.customerDetails.taxId,
        streetAddress: values.customerDetails.streetAddress,
        city: values.customerDetails.city,
        state: values.customerDetails.state,
        zipCode: values.customerDetails.zipCode,
        country: values.customerDetails.country
      };

      // Safely resolve Customer, Shipper, and Consignee
      const finalCompanyId = await resolveCompanyId(values.customerDetails.companyId, "Customer", customerExtraData);
      const finalShipperId = await resolveCompanyId(values.partyDetails?.shipperId, "Shipper");
      const finalConsigneeId = await resolveCompanyId(values.partyDetails?.consigneeId, "Consignee");

      // Safely resolve all Vendors
      const finalVendorDetails = await Promise.all(
        (values.vendorDetails || []).map(async (vendor) => {
          const finalVendorId = await resolveCompanyId(vendor.vendorId, "Vendor");
          return {
            vendorId: finalVendorId,
            assignedTask: vendor.vendorType 
          };
        })
      );

      // --- COMPILE FINAL PAYLOAD ---
      const finalJobPayload = {
        ...values,
        customerDetails: {
          companyId: finalCompanyId, // Guaranteed to be a real DB ID now!
          salesPerson: values.customerDetails.salesPerson,
          taxId: values.customerDetails.taxId,
          streetAddress: values.customerDetails.streetAddress,
          city: values.customerDetails.city,
          state: values.customerDetails.state,
          zipCode: values.customerDetails.zipCode,
          country: values.customerDetails.country
        },
        partyDetails: {
          // The || undefined prevents empty strings from crashing Mongoose
          shipperId: finalShipperId || undefined,
          consigneeId: finalConsigneeId || undefined
        },
        shipmentDetails: {
          mode: values.shipmentDetails.mode,
          portOfLoading: values.shipmentDetails.originPort,
          portOfDischarge: values.shipmentDetails.destinationPort
        },
        cargoDetails: {
          commodity: values.cargoDetails.commodity,
          noOfPackages: values.cargoDetails.packageCount,
          grossWeight: values.cargoDetails.grossWeight,
          etd: values.cargoDetails.etd,
          eta: values.cargoDetails.eta
        },
        vendorDetails: finalVendorDetails
      };

      // --- SAVE THE JOB ---
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalJobPayload),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Job successfully created:", result.data);
        router.push("/dashboard");
      } else {
        console.error("Backend refused the job:", result.error);
      }
    } catch (error: any) {
      console.error("Network error submitting form:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.error("ZOD BLOCKED THE SUBMISSION! Missing fields: ", errors))} className="flex flex-col h-screen bg-surface text-on-surface">
        <Header />
        <div className="flex-1 overflow-y-auto p-8 lg:p-14 space-y-10">
          <div className="max-w-5xl mx-auto space-y-10">
            <CustomerSection />
            <PartiesSection />
            <RoutingSection />
            <CargoSection />
            <VendorSection />
            <DocumentsSection />
          </div>
        </div>
      </form>
    </Form>
  )
}
// "use client"

// import { zodResolver } from "@hookform/resolvers/zod"
// import { useForm } from 'react-hook-form'
// import * as z from "zod"

// import { Form } from "@/components/ui/form"
// import Header from "@/components/dashboard/new-job/header"
// import CustomerSection from "@/components/dashboard/new-job/customer-section"
// import PartiesSection from "@/components/dashboard/new-job/parties-section"
// import RoutingSection from "@/components/dashboard/new-job/routing-section"
// import CargoSection from "@/components/dashboard/new-job/cargo-section"
// import VendorSection from "@/components/dashboard/new-job/vendor-section"
// import DocumentsSection from "@/components/dashboard/new-job/document-section"
// import { useRouter } from "next/navigation"
// import { vendored } from "next/dist/server/route-modules/app-page/module.compiled"

// // Defining the Zod Schema (Mirrors Mongoose Models)
// export const jobFormSchema = z.object({
//   customerDetails: z.object({
//     companyId: z.string().min(1, { message: "Please select a company." }),
//     salesPerson: z.string().optional(),
//     billingAddress: z.string({ error: "Address is required" }),
//   }),
//   partyDetails: z.object({
//     shipperId: z.string().optional(),
//     consigneeId: z.string().optional()
//   }).optional(),
//   shipmentDetails: z.object({
//     mode: z.string({ error: "Transport mode is required" }),
//     originPort: z.string().optional(),
//     destinationPort: z.string().optional(),
//   }),
//   cargoDetails: z.object({
//     commodity: z.string().optional(),
//     packageCount: z.number().optional(),
//     grossWeight: z.string().optional(),
//     etd: z.date().optional(),
//     eta: z.date().optional(),
//   }),
//   vendorDetails: z.array(
//     z.object({
//       vendorId: z.string(),
//       vendorType: z.string()
//     })
//   ).optional(),
// })
// export type JobFormValues = z.infer<typeof jobFormSchema>
// export default function NewJobPage() {
//   const router = useRouter();
//   // Initialize form here...
//   const form = useForm<z.infer<typeof jobFormSchema>>({
//     resolver: zodResolver(jobFormSchema),
//     defaultValues: {
//       customerDetails: { companyId: "", salesPerson: "", billingAddress: "" },
//       partyDetails: { shipperId: "", consigneeId: "" },
//       shipmentDetails: { mode: "", originPort: "", destinationPort: "" },
//       cargoDetails: { commodity: "", packageCount: 0, grossWeight: "" },
//       vendorDetails: [],
//     },
//   })
//   //

//   // Defining onSubmit
//   // async function onSubmit(values:z.infer<typeof jobFormSchema>){
//   //   console.log("READY FOR MONGODB: " ,values)

//   //   //initiate api: await fetch('/api/jobs')
//   //   try{
//   //     const response = await fetch('/api/jobs',{
//   //       method:'POST',
//   //       headers:{'Content-Type':'application/json'},
//   //       body:JSON.stringify(values),
//   //     })
//   //     const result = await response.json();
//   //     if(response.ok){
//   //       console.log("Job successfully created in Database: ",result.data);
//   //       router.push("/dashboard")
//   //     }else{
//   //       console.error("Backend refused the Job: ",result.error);
//   //     }
//   //   }catch(error:any){
//   //     console.error("Network Error submitting the form: ",error)
//   //   }
//   // }
//   async function onSubmit(values: z.infer<typeof jobFormSchema>) {
//     try {
//       let finalCompanyId = values.customerDetails.companyId;

//       // 1. Check if the ID is a raw string instead of a 24-character MongoDB ObjectId
//       const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(finalCompanyId);
//       if (!isValidMongoId) {
//         console.log("New company detected! Creating directory record first...");

//         // Create the company with ALL the details they just typed into the unlocked fields
//         const companyRes = await fetch('/api/companies', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             name: finalCompanyId, // "Nova Logistics"
//             defaultSalesPerson: values.customerDetails.salesPerson,
//             billingAddress: values.customerDetails.billingAddress,
//             type: ["Customer"]
//           }),
//         });

//         const companyResult = await companyRes.json();

//         if (companyRes.ok) {
//           // Swap the raw string out for the brand new, real MongoDB ID
//           finalCompanyId = companyResult.data._id;
//         } else {
//           throw new Error(companyResult.error);
//         }
//       }
//       // ==========================================
//       // 1.5 INTERCEPT THE PARTIES (SHIPPER & CONSIGNEE)
//       // ==========================================
//       let finalShipperId = values.partyDetails?.shipperId;
//       let finalConsigneeId = values.partyDetails?.consigneeId;

//       // Handle Shipper Auto-Creation
//       if (finalShipperId && !/^[0-9a-fA-F]{24}$/.test(finalShipperId)) {
//         console.log("New Shipper detected! Creating...");
//         const res = await fetch('/api/companies', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ name: finalShipperId, type: ["Shipper"] }),
//         });
//         const result = await res.json();
//         if (res.ok) finalShipperId = result.data._id;
//       }

//       // Handle Consignee Auto-Creation
//       if (finalConsigneeId && !/^[0-9a-fA-F]{24}$/.test(finalConsigneeId)) {
//         console.log("New Consignee detected! Creating...");
//         const res = await fetch('/api/companies', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ name: finalConsigneeId, type: ["Consignee"] }),
//         });
//         const result = await res.json();
//         if (res.ok) finalConsigneeId = result.data._id;
//       }
//       // ==========================================
//       // 2. INTERCEPT THE VENDORS (THE FIX!)
//       // ==========================================
//       // We use Promise.all to process multiple vendors at the same time
//       const finalVendorDetails = await Promise.all(
//         (values.vendorDetails || []).map(async (vendor) => {
//           let finalVendorId = vendor.vendorId;
//           const isVendorValidMongoId = /^[0-9a-fA-F]{24}$/.test(finalVendorId)
//           // If the vendor is a raw string, create it in the DB!
//           if (!isVendorValidMongoId) {
//             console.log(`New vendor detected: ${finalVendorId}. Creating...`);

//             const vRes = await fetch('/api/companies', {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json' },
//               body: JSON.stringify({
//                 name: finalVendorId,
//                 type: ["Vendor"], // Important: Matches your DB Schema
//               }),
//             });

//             const vResult = await vRes.json();
//             if (vRes.ok) {
//               finalVendorId = vResult.data._id; // Swap the string for the ID!
//             } else {
//               console.error(`Vendor creation failed for ${finalVendorId}`);
//             }
//           }

//           // Return the correctly mapped object for the JobModel
//           return {
//             vendorId: finalVendorId,
//             assignedTask: vendor.vendorType // Mapping frontend name to backend name
//           };
//         })
//       );
//       // 2. Now prepare the final Job payload with the correct MongoDB ID
//       const finalJobPayload = {
//         ...values,
//         customerDetails: {
//           ...values.customerDetails,
//           companyId: finalCompanyId, // Guaranteed to be a real DB ID now!
//         },
//         partyDetails: {
//           shipperId: finalShipperId,
//           consigneeId: finalConsigneeId
//         },
//         shipmentDetails: {
//           mode: values.shipmentDetails.mode,
//           portOfLoading: values.shipmentDetails.originPort,
//           portOfDischarge: values.shipmentDetails.destinationPort
//         },
//         cargoDetails: {
//           commodity: values.cargoDetails.commodity,
//           noOfPackages: values.cargoDetails.packageCount,
//           grossWeight: values.cargoDetails.grossWeight,
//           etd: values.cargoDetails.etd,
//           eta: values.cargoDetails.eta
//         },
//         vendorDetails: finalVendorDetails
//       };

//       // 3. Save the Job!
//       const response = await fetch('/api/jobs', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(finalJobPayload),
//       });

//       const result = await response.json();

//       if (response.ok) {
//         console.log("Job successfully created:", result.data);
//         router.push("/dashboard");
//       } else {
//         console.error("Backend refused the job:", result.error);
//       }
//     } catch (error: any) {
//       console.error("Network error submitting form:", error);
//     }
//   }
//   return (
//     <Form {...form}>
//       {/* The actual HTML form tag */}
//       <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.error("ZOD BLOCKED THE SUBMISSION! Missing fields: ", errors))} className="flex flex-col h-screen bg-surface text-on-surface">

//         <Header />

//         <div className="flex-1 overflow-y-auto p-8 lg:p-14 space-y-10">
//           <div className="max-w-5xl mx-auto space-y-10">
//             {/* Because these are inside <Form>, they can now access the data! */}
//             <CustomerSection />
//             <PartiesSection />
//             <RoutingSection />
//             <CargoSection />
//             <VendorSection />
//             <DocumentsSection />
//           </div>
//         </div>

//       </form>
//     </Form>
//   )
// }