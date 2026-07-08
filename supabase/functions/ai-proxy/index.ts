import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      return new Response(JSON.stringify({ error: 'Server key is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const model = String(body?.model || 'google/gemini-2.0-flash-001');
    const temperature = Number.isFinite(Number(body?.temperature)) ? Number(body.temperature) : 0.75;
    const maxTokens = Number.isFinite(Number(body?.max_tokens)) ? Number(body.max_tokens) : 8000;

    let messages = Array.isArray(body?.messages) ? body.messages : null;
    if (!messages && typeof body?.prompt === 'string') {
      messages = [{ role: 'user', content: body.prompt }];
    }

    if (!messages || !messages.length) {
      return new Response(JSON.stringify({ error: 'messages or prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payload = {
      model,
      messages,
      temperature,
      max_tokens: Math.max(256, Math.min(12000, maxTokens))
    };

    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': req.headers.get('origin') || 'https://supabase.functions.local',
        'X-Title': 'The Soft Wave'
      },
      body: JSON.stringify(payload)
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return new Response(JSON.stringify({
        error: data?.error?.message || `Upstream error ${upstream.status}`,
        status: upstream.status
      }), {
        status: upstream.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      content: data?.choices?.[0]?.message?.content || '',
      provider: 'openrouter',
      model
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
