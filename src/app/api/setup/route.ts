import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, validateDatabaseSetup } from '@/lib/db-init';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'validate';
    
    let result;
    
    if (action === 'init') {
      result = await initializeDatabase();
    } else {
      result = await validateDatabaseSetup();
    }
    
    const statusCode = result.success ? 200 : 500;
    
    return NextResponse.json(result, { status: statusCode });
    
  } catch (error) {
    console.error('Setup API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Setup operation failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await initializeDatabase();
    
    const statusCode = result.success ? 200 : 500;
    
    return NextResponse.json(result, { status: statusCode });
    
  } catch (error) {
    console.error('Setup API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Database initialization failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
} 