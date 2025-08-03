import { NextRequest, NextResponse } from 'next/server';
import { checkConnectionHealth } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check MongoDB connection health
    const dbHealth = await checkConnectionHealth();
    
    const responseTime = Date.now() - startTime;
    
    // System health status
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime,
      services: {
        database: {
          status: dbHealth.isConnected ? 'healthy' : 'unhealthy',
          connectionTime: dbHealth.connectionTime,
          error: dbHealth.error
        },
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external
        },
        environment: {
          node: process.version,
          platform: process.platform,
          arch: process.arch
        }
      }
    };
    
    // Determine overall health status
    if (!dbHealth.isConnected) {
      health.status = 'degraded';
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: {
          status: 'unhealthy',
          error: 'Health check failed'
        }
      }
    }, { status: 503 });
  }
} 