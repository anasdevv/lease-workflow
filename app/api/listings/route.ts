import { getAllListings } from "@/actions/application/action";
import { NextResponse } from "next/server";

export  async function GET(){
    const response = await getAllListings();
    if(!response.success){
        return NextResponse.json({
            success: false,
            error: response.error || 'Failed to fetch listings'
        }, {status: 500});
    }
    return  NextResponse.json(response)
} 