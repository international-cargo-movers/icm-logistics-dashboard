import mongoose, {Schema, Document, models} from 'mongoose';

export interface IPort extends Document{
    name:string;
    locode:string;
    country:string;
    countryCode:string;
    type:string[];
    isActive:boolean;
}

export const PortSchema = new Schema<IPort>(
    {
        name:{type:String,required:true},
        locode:{type:String, required:false, uppercase:true},
        country:{type:String,required:true},
        countryCode:{type:String,required:true},
        type:[{type:String,enum:["Sea","Air","Land","Rail"]}],
        isActive:{type:Boolean,default:true}
    },
    {timestamps:true}
);

// Unique index for LOCODE that only applies when it's present and non-empty
PortSchema.index(
  { locode: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { 
      locode: { $exists: true, $gt: "" } 
    } 
  }
);

PortSchema.index({countryCode:1});
PortSchema.index({name:1});
PortSchema.index({type:1});

export default models.Port || mongoose.model<IPort>("Port",PortSchema);