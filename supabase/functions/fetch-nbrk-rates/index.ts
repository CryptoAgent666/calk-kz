interface NBRKRateItem {
  fullname: string;
  title: string;
  description: string;
  quant: string;
  index: string;
  change: string;
}

interface ExchangeRateRecord {
  currency_code: string;
  rate_to_kzt: number;
  report_date: string;
  last_fetched_at: string;
  nbrk_form_id: number | null;
  currency_name_ru: string | null;
  currency_name_kz: string | null;
  currency_name_en: string | null;
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
    console.log('Starting exchange rates fetch from NBRK...');

    // Format current date as DD.MM.YYYY for NBRK API
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}.${month}.${year}`;

    // NBRK API URL
    const nbrkApiUrl = `https://nationalbank.kz/rss/get_rates.cfm?fdate=${dateStr}`;
    
    console.log('Fetching from NBRK API:', nbrkApiUrl);

    // Fetch exchange rates from NBRK
    const apiResponse = await fetch(nbrkApiUrl);
    console.log('NBRK API response status:', apiResponse.status);

    if (!apiResponse.ok) {
      throw new Error(`NBRK API request failed with status ${apiResponse.status}`);
    }

    const xmlText = await apiResponse.text();
    console.log('NBRK API response received, XML length:', xmlText.length);

    // Parse XML to extract rates
    const parseXMLRates = (xml: string): NBRKRateItem[] => {
      const items: NBRKRateItem[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];
        
        const extractTag = (tag: string): string => {
          const tagRegex = new RegExp(`<${tag}>([^<]*)<\/${tag}>`, 'i');
          const tagMatch = itemXml.match(tagRegex);
          return tagMatch ? tagMatch[1].trim() : '';
        };

        items.push({
          fullname: extractTag('fullname'),
          title: extractTag('title'),
          description: extractTag('description'),
          quant: extractTag('quant'),
          index: extractTag('index'),
          change: extractTag('change')
        });
      }
      
      return items;
    };

    const nbrkItems = parseXMLRates(xmlText);
    console.log('Parsed NBRK rates:', nbrkItems.length, 'currencies');

    // Target currencies for converter (filter NBRK data)
    const targetCurrencies = ['USD', 'EUR', 'RUB', 'CNY', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];
    
    // Currency name mappings (Kazakh names from NBRK)
    const currencyNamesKz: { [key: string]: string } = {
      'ДОЛЛАР США': 'АҚШ доллары',
      'ЕВРО': 'Еуро',
      'РОССИЙСКИЙ РУБЛЬ': 'Ресей рублі',
      'КИТАЙСКИЙ ЮАНЬ': 'Қытай юані',
      'ФУНТ СТЕРЛИНГОВ СОЕДИНЕННОГО КОРОЛЕВСТВА': 'Британ фунты',
      'ЯПОНСКАЯ ЙЕНА': 'Жапон иенасы',
      'ШВЕЙЦАРСКИЙ ФРАНК': 'Швейцария франкі',
      'КАНАДСКИЙ ДОЛЛАР': 'Канада доллары',
      'АВСТРАЛИЙСКИЙ ДОЛЛАР': 'Австралия доллары'
    };

    const currencyNamesEn: { [key: string]: string } = {
      'ДОЛЛАР США': 'US Dollar',
      'ЕВРО': 'Euro',
      'РОССИЙСКИЙ РУБЛЬ': 'Russian Ruble',
      'КИТАЙСКИЙ ЮАНЬ': 'Chinese Yuan',
      'ФУНТ СТЕРЛИНГОВ СОЕДИНЕННОГО КОРОЛЕВСТВА': 'British Pound',
      'ЯПОНСКАЯ ЙЕНА': 'Japanese Yen',
      'ШВЕЙЦАРСКИЙ ФРАНК': 'Swiss Franc',
      'КАНАДСКИЙ ДОЛЛАР': 'Canadian Dollar',
      'АВСТРАЛИЙСКИЙ ДОЛЛАР': 'Australian Dollar'
    };

    // Convert NBRK rates to our format
    const exchangeRateRecords: ExchangeRateRecord[] = [];
    
    // Add KZT as base currency (always 1)
    exchangeRateRecords.push({
      currency_code: 'KZT',
      rate_to_kzt: 1,
      report_date: `${year}-${month}-${day}`,
      last_fetched_at: new Date().toISOString(),
      nbrk_form_id: null,
      currency_name_ru: 'Казахстанский тенге',
      currency_name_kz: 'Қазақстан теңгесі',
      currency_name_en: 'Kazakhstani Tenge'
    });

    // Process NBRK rates
    for (const item of nbrkItems) {
      const currencyCode = item.title;
      
      // Only include currencies we support
      if (!targetCurrencies.includes(currencyCode)) {
        continue;
      }

      const rateValue = parseFloat(item.description);
      const quantValue = parseInt(item.quant) || 1;

      if (isNaN(rateValue) || rateValue <= 0) {
        console.warn(`Skipping invalid rate for ${currencyCode}:`, item.description);
        continue;
      }

      // Calculate rate per 1 unit (NBRK gives rate per quant units)
      const rateToKzt = rateValue / quantValue;

      const fullnameUpper = item.fullname.toUpperCase();

      exchangeRateRecords.push({
        currency_code: currencyCode,
        rate_to_kzt: Number(rateToKzt.toFixed(4)),
        report_date: `${year}-${month}-${day}`,
        last_fetched_at: new Date().toISOString(),
        nbrk_form_id: null,
        currency_name_ru: item.fullname || null,
        currency_name_kz: currencyNamesKz[fullnameUpper] || null,
        currency_name_en: currencyNamesEn[fullnameUpper] || null
      });
    }

    console.log('Prepared exchange rate records:', exchangeRateRecords.length);
    console.log('Sample rates:', exchangeRateRecords.slice(0, 3).map(r => 
      `${r.currency_code}: ${r.rate_to_kzt} KZT`
    ));

    // Connect to Supabase client for RPC calls
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    console.log('Using batch RPC function for exchange rates...');
    
    // Call the batch upsert RPC function
    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/upsert_exchange_rate_batch`;
    const rpcResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rates_data: exchangeRateRecords
      })
    });

    if (!rpcResponse.ok) {
      const errorText = await rpcResponse.text();
      console.error(`Batch RPC failed: Status ${rpcResponse.status}, Response: ${errorText}`);
      throw new Error(`Failed to update exchange rates via RPC: ${errorText}`);
    }

    const rpcResult = await rpcResponse.json();
    console.log('Batch RPC completed:', rpcResult);

    console.log('Upserted rates successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Updated ${exchangeRateRecords.length} exchange rates from NBRK`,
        rates: exchangeRateRecords.map(r => ({ 
          currency: r.currency_code, 
          rate: r.rate_to_kzt 
        })),
        source: 'National Bank of Republic of Kazakhstan (nationalbank.kz)',
        report_date: `${day}.${month}.${year}`,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in fetch-nbrk-rates function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch exchange rates',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});