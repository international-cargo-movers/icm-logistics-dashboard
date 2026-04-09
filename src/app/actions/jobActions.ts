"use server"

import dbConnect from "@/lib/mongodb"
import JobModel from "@/model/JobModel"
import {revalidatePath} from "next/cache"

export async function updateJobStatus(jobId:string, newStatus: string){
    try{
        await dbConnect()

        await JobModel.findOneAndUpdate(
            {jobId:jobId},
            {$set:{"cargoDetails.jobStatus":newStatus}}
        )

        revalidatePath(`/dashboard/jobs/${jobId}`)
        revalidatePath("/dashboard")

        return {success:true}
    }catch(error:any){
        console.error("Failed to update status: ",error);
        return {success:false,error:error.message}
    }
}