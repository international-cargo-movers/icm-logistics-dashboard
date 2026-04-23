import { getModel, getAdminModel } from "./ModelRegistry";
import { JobSchema } from "./JobModel";
import { CompanySchema } from "./CompanyModel";
import { InvoiceSchema } from "./InvoiceModel";
import { QuoteSchema } from "./QuoteModel";
import { ReceiptSchema } from "./ReceiptModel";
import { VendorInvoiceSchema } from "./VendorInvoiceModel";
import { PortSchema } from "./PortModel";
import { UserSchema } from "./UserModel";

export async function getTenantModels() {
  return {
    Job: await getModel("Job", JobSchema),
    Company: await getModel("CompanyModel", CompanySchema),
    Invoice: await getModel("Invoice", InvoiceSchema),
    Quote: await getModel("Quote", QuoteSchema),
    Receipt: await getModel("Receipt", ReceiptSchema),
    VendorInvoice: await getModel("VendorInvoice", VendorInvoiceSchema),
  };
}

export async function getAdminModels() {
  return {
    User: await getAdminModel("User", UserSchema),
    Port: await getAdminModel("Port", PortSchema),
  };
}
