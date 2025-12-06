import { NextResponse, NextRequest } from "next/server"

export function GET(request: NextRequest) {
    console.log(request)
    return NextResponse.json({ message: "Hello" })
}