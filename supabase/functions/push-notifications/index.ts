import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Expo Push API endpoint
const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  try {
    const payload = await req.json();
    const { event_type, record } = payload;

    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let messages: any[] = [];

    if (event_type === "JOB_ACCEPTED") {
      // Notify the recruiter that their job was accepted
      const recruiterId = record.recruiter_id;
      const { data: recruiter } = await supabaseClient
        .from("profiles")
        .select("push_token, app_language")
        .eq("id", recruiterId)
        .single();

      if (recruiter && recruiter.push_token) {
        messages.push({
          to: recruiter.push_token,
          sound: "default",
          title: recruiter.app_language === 'te' ? "పని అంగీకరించబడింది!" : 
                 recruiter.app_language === 'hi' ? "काम स्वीकार कर लिया गया!" : 
                 "Work Accepted!",
          body: `A worker has accepted your work: ${record.work_name}. Open the app to view details.`,
          data: { jobId: record.id, type: "JOB_ACCEPTED" },
        });
      }
    } else if (event_type === "JOB_POSTED") {
      // Find matching workers
      const jobLat = record.job_lat;
      const jobLng = record.job_lng;

      // Use the existing Postgres function or run a custom query
      // To keep it simple, we can call a custom RPC or just write the PostGIS query here
      // But Deno doesn't do PostGIS directly, we need an RPC.
      // Let's create a quick RPC to find matching push tokens, or just query profiles directly
      // using raw SQL via a view or RPC. Since we can't do raw SQL from supabase-js, we need an RPC.
      
      const { data: matchingWorkers, error } = await supabaseClient.rpc("get_push_tokens_for_new_job", {
        job_id: record.id,
        j_lat: jobLat,
        j_lng: jobLng,
        j_name: record.work_name
      });

      if (matchingWorkers && matchingWorkers.length > 0) {
        matchingWorkers.forEach((worker: any) => {
          messages.push({
            to: worker.push_token,
            sound: "default",
            title: worker.app_language === 'te' ? "కొత్త పని అందుబాటులో ఉంది!" : 
                   worker.app_language === 'hi' ? "आपके कौशल से मेल खाता नया काम!" : 
                   "New Work Matching Your Skills!",
            body: `A new work "${record.work_name}" was posted near you. Tap to view.`,
            data: { jobId: record.id, type: "JOB_POSTED" },
          });
        });
      }
    }

    // Send push notifications via Expo
    if (messages.length > 0) {
      const expoRes = await fetch(EXPO_PUSH_ENDPOINT, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });
      const expoData = await expoRes.json();
      console.log("Expo push response:", expoData);
    }

    return new Response(JSON.stringify({ success: true, sent: messages.length }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
