import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import POI from '@/models/POI';

export async function GET() {
  await dbConnect();
  try {
    const pois = await POI.find({});
    return NextResponse.json(pois);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching POIs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const poi = await POI.create(body);
    return NextResponse.json(poi, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating POI' }, { status: 500 });
  }
}
