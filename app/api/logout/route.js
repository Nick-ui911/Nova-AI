import { NextResponse } from "next/server";
import { cookies } from "next/headers";


export async function POST() {
    const cookieStore = await cookies(); // 👈 await here
  
    cookieStore.set('token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
    });
  
    return NextResponse.json({ message: 'Logout successful' });
  }