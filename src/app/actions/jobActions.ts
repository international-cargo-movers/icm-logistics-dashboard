"use server"

import dbConnect from "@/lib/mongodb"
import { getTenantModels } from "@/model/tenantModels"
import {revalidatePath} from "next/cache"

export async function updateJobStatus(id:string, newStatus: string){
    try{
        await dbConnect()
        const { Job } = await getTenantModels()

        await Job.findByIdAndUpdate(
            id,
            {$set:{"cargoDetails.jobStatus":newStatus}}
        )

        revalidatePath(`/dashboard/jobs/${id}`)
        revalidatePath("/dashboard")

        return {success:true}
    }catch(error:any){
        console.error("Failed to update status: ",error);
        return {success:false,error:error.message}
    }
}