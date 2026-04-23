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
        locode:{type:String, required:true,unique:true,uppercase:true},
        country:{type:String,required:true},
        countryCode:{type:String,required:true,uppercase:true,minlength:2,maxlength:2},
        type:[{type:String,enum:["Sea","Air","Land","Rail"]}],
        isActive:{type:Boolean,default:true}
    },
    {timestamps:true}
);

PortSchema.index({countryCode:1});
PortSchema.index({name:1});
PortSchema.index({type:1});

export default models.Port || mongoose.model<IPort>("Port",PortSchema);