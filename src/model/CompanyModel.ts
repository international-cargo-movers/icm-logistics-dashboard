import mongoose,{Schema,Document,models} from "mongoose";

export interface ICompany extends Document{
    name:string;
    type:string[]; // could be ["Customer"],["Shipper","Consignee"] or ["Vendor"] [Overseas Agent]

    // -- Primary Contact --
    contactName?: string;  // e.g., "John Doe"
    contactEmail?: string; 
    contactPhone?: string; // Crucial for truckers to call the warehouse!

    billingAddress?:string;
    city?: string;
    country?: string;

    taxId?:string;
    defaultSalesPerson?:string;
}

const CompanySchema = new Schema<ICompany>(
    {
        name:{type:String, required:true,unique:true},
        type:[{type:String,required:true}],

        contactName:{type:String},
        contactEmail:{type:String},
        contactPhone:{type:String},
        billingAddress:{type:String},
        city:{type:String},
        country:{type:String},
        taxId:{type:String},
        defaultSalesPerson:{type:String},
    },
    {timestamps:true}
);

export default models.CompanyModel || mongoose.model<ICompany>("CompanyModel",CompanySchema);