import mongoose,{Schema,Document,models} from "mongoose";

export interface ICompany extends Document{
    name:string;
    type:string[]; // could be ["Customer"],["Shipper","Consignee"] or ["Vendor"] [Overseas Agent]

    // -- Primary Contact --
    contactName?: string;  // e.g., "John Doe"
    contactEmail?: string; 
    contactPhone?: string; // Crucial for truckers to call the warehouse!

    // billingAddress?:string;
    streetAddress?: string; // Line 1 & 2 combined (e.g., "Plot 42, Sector 18")
    city?: string;
    state?: string;         // Province / Region
    zipCode?: string;       // Postal Code
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
        // billingAddress:{type:String},
        streetAddress: { type: String },
        city:{type:String},
        state: { type: String },
        zipCode: { type: String },
        country:{type:String},
        taxId:{type:String},
        defaultSalesPerson:{type:String},
    },
    {timestamps:true}
);

export default models.CompanyModel || mongoose.model<ICompany>("CompanyModel",CompanySchema);