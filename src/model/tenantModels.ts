import { getModel, getAdminModel } from "./ModelRegistry";
import { JobSchema } from "./JobModel";
import { CompanySchema } from "./CompanyModel";
import { InvoiceSchema } from "./InvoiceModel";
import { QuoteSchema } from "./QuoteModel";
import { ReceiptSchema } from "./ReceiptModel";
import { VendorInvoiceSchema } from "./VendorInvoiceModel";
import { VendorBillSchema } from "./VendorBillModel";
import { CustomerBillSchema } from "./CustomerBillModel";
import { PortSchema } from "./PortModel";
import { UserSchema } from "./UserModel";
import { FinancialItemSchema } from "./FinancialItemModel";
import { CarrierVehicleSchema } from "./CarrierVehicleModel";

export async function getTenantModels() {
  return {
    Job: await getModel("Job", JobSchema),
    Company: await getModel("CompanyModel", CompanySchema),
    Invoice: await getModel("Invoice", InvoiceSchema),
    Quote: await getModel("Quote", QuoteSchema),
    Receipt: await getModel("FinancialReceipt", ReceiptSchema),
    VendorInvoice: await getModel("VendorInvoice", VendorInvoiceSchema),
    VendorBill: await getModel("VendorBill", VendorBillSchema),
    CustomerBill: await getModel("CustomerBill", CustomerBillSchema),
  };
}

export async function getAdminModels() {
  return {
    User: await getAdminModel("User", UserSchema),
    Port: await getAdminModel("Port", PortSchema),
    FinancialItem: await getAdminModel("FinancialItem", FinancialItemSchema),
    CarrierVehicle: await getAdminModel("CarrierVehicle", CarrierVehicleSchema),
  };
}
