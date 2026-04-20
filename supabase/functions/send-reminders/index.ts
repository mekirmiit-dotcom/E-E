// supabase/functions/send-reminders/index.ts
// Deploy with: supabase functions deploy send-reminders

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayStr = today.toISOString().split("T")[0]
    const tomorrowStr = tomorrow.toISOString().split("T")[0]

    // Find tasks due today or tomorrow that are not done
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("id, title, due_date, owner, status")
      .in("due_date", [todayStr, tomorrowStr])
      .neq("status", "done")

    if (error) throw error

    const notifications = []

    for (const task of tasks ?? []) {
      const isToday = task.due_date === todayStr
      const message = isToday
        ? `🚨 "${task.title}" görevi BUGÜN teslim edilmeli!`
        : `⏰ "${task.title}" görevi yarın teslim edilmeli!`

      // Check if we already sent this notification today
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("task_id", task.id)
        .eq("type", isToday ? "overdue" : "reminder")
        .gte("created_at", today.toISOString().split("T")[0])
        .limit(1)

      if (!existing || existing.length === 0) {
        notifications.push({
          task_id: task.id,
          message,
          type: isToday ? "overdue" : "reminder",
          read: false,
        })
      }
    }

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications)

      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: tasks?.length ?? 0,
        notificationsSent: notifications.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
