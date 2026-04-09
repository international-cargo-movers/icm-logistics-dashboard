import mongoose,{Schema,Document,models} from "mongoose";

export interface ILineItem{
    description: string;
    sacCode:string;
    rate:number;
    currency:string;
    roe:number; //Rate of exchange
    gstPercent:number;
    taxableValue:number;
    gstAmount:number;
}

export interface IInvoice extends Document{
    invoiceNo:string;
    invoiceDate:Date;
    jobId:mongoose.Types.ObjectId;

    customerDetails:{
        companyId:mongoose.Types.ObjectId;
        name:string;
        billingAddress?:string;
        gstin?:string;
        email?:string;
    }

    shipmentSnapshot:{
        origin?:string;
        destination?:string;
        pol?:string;
        pod?:string;
        vesselFlight?:string;
        commodity?:string;
        grossWeight?:number;
        chargeableWeight?:number;
        noOfPackages?:number;
    };

    lineItems:ILineItem[];

    totals:{
        totalTaxable:number;
        totalGst:number;
        roundOff:number;
        netAmount:number;
    };

    status:"Draft"|"Unpaid"|"Paid"|"Overdue"
}

const InvoiceSchema = new Schema<IInvoice>({
    invoiceNo:{type:String,required:true,unique:true},
    invoiceDate:{type:Date,default:Date.now,required:true},
    jobId:{type:Schema.Types.ObjectId,ref:"Job",required:true},

    customerDetails:{
        companyId:{type:Schema.Types.ObjectId,ref:"CompanyModel",required:true},
        name:{type:String,required:true},
        billingAddress:{type:String,required:true},
        gstin:{type:String},
        email:{type:String},
    },

    shipmentSnapshot:{
        origin:{type:String},
        destination:{type:String},
        pol:{type:String},
        pod:{type:String},
        vesselFlight:{type:String},
        commodity:{type:String},
        grossWeight:{type:Number},
        chargeableWeight:{type:Number},
        noOfPackages:{type:Number},
    },

    lineItems:[{
        description:{type:String,required:true},
        sacCode:{type:String},
        rate:{type:String,required:true},
        currency:{type:String,default:"INR"},
        roe:{type:Number,default:1},
        gstPercent:{type:Number,required:true},
        taxableValue:{type:Number,required:true},
        gstAmount:{type:Number,required:true}
    }],

    totals:{
        totalTaxable:{type:Number,required:true},
        totalGst:{type:Number,required:true},
        roundOff:{type:Number,default:0},
        netAmount:{type:Number,required:true},
    },

    status:{
        type:String,
        enum:["Draft","Unpaid","Paid","Overdue"],
        default:"Draft"
    }
},{timestamps:true})

export default models.Invoice || mongoose.model<IInvoice>("Invoice",InvoiceSchema);