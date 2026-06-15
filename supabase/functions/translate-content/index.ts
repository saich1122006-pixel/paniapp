import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LANGUAGES = ['hi', 'te'];

async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text) return "";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Translate HTTP error: ${res.status}`);
    const json = await res.json();
    // The response is an array of arrays, e.g. [[["Hola", "Hello", null, null, 1]], null, "en"]
    return json[0].map((item: any) => item[0]).join('');
  } catch (error) {
    console.error(`Translation error for ${targetLang}:`, error);
    return text; // Fallback to original text if translation fails
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { table, id, textFields } = body;

    if (!table || !id || !textFields) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: table, id, or textFields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing translations to merge with
    const { data: existingRow, error: fetchError } = await supabaseClient
      .from(table)
      .select('translations')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch existing row: ${fetchError.message}`);
    }

    const translations: Record<string, Record<string, string>> = existingRow?.translations || {};

    // Translate each text field into the target languages
    for (const lang of LANGUAGES) {
      if (!translations[lang]) translations[lang] = {};
      
      for (const [key, text] of Object.entries(textFields)) {
        if (typeof text === 'string' && text.trim() !== '') {
          const translatedText = await translateText(text, lang);
          translations[lang][key] = translatedText;
        }
      }
    }

    // Update the record with the new translations
    const { error: updateError } = await supabaseClient
      .from(table)
      .update({ translations })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Failed to update translations: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, translations }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Edge Function Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
