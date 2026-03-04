// Scheduled function to update exchange rates twice daily
// This function is designed to be called by pg_cron or external scheduler

interface ScheduledUpdateResult {
  success: boolean;
  message: string;
  timestamp: string;
  ratesUpdated?: number;
  error?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('Starting scheduled exchange rates update...');

    // Get Supabase configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Call the main exchange rates fetch function
    const fetchRatesUrl = `${supabaseUrl}/functions/v1/fetch-nbrk-rates`;
    
    console.log('Calling fetch-nbrk-rates function...');
    
    const fetchResponse = await fetch(fetchRatesUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error(`Failed to fetch rates: ${fetchResponse.status} - ${errorText}`);
      
      const errorResult: ScheduledUpdateResult = {
        success: false,
        message: 'Failed to update exchange rates',
        timestamp: new Date().toISOString(),
        error: `HTTP ${fetchResponse.status}: ${errorText}`
      };

      return new Response(
        JSON.stringify(errorResult),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const fetchResult = await fetchResponse.json();
    console.log('Fetch rates result:', fetchResult);

    // Log the successful update
    console.log('Scheduled update completed successfully');

    const result: ScheduledUpdateResult = {
      success: true,
      message: 'Exchange rates updated successfully via scheduled job',
      timestamp: new Date().toISOString(),
      ratesUpdated: fetchResult.rates?.length || 0
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in scheduled rates update:', error);
    
    const errorResult: ScheduledUpdateResult = {
      success: false,
      message: 'Scheduled exchange rates update failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return new Response(
      JSON.stringify(errorResult),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});