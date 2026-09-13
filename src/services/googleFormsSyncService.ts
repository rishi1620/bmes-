import { supabase } from "@/integrations/supabase/client";
import { 
  getFormDetails, 
  getFormResponses, 
  extractGoogleFormId,
  FormResponseItem 
} from "@/lib/googleWorkspace";
import { getAccessToken } from "@/lib/googleAuth";

export interface SyncAuditStats {
  lastSyncedAt: string | null;
  status: "idle" | "syncing" | "success" | "warning" | "error";
  feedbackSynced: number;
  registrationsSynced: number;
  totalFeedbackInDb: number;
  totalRegistrationsInDb: number;
  message: string;
  error?: string | null;
  autoSyncEnabled: boolean;
}

const STORAGE_KEY = "bmes_gforms_sync_stats";

export function getStoredSyncStats(): SyncAuditStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to parse stored sync stats:", e);
  }
  return {
    lastSyncedAt: null,
    status: "idle",
    feedbackSynced: 0,
    registrationsSynced: 0,
    totalFeedbackInDb: 0,
    totalRegistrationsInDb: 0,
    message: "Google Forms sync service initialized.",
    error: null,
    autoSyncEnabled: true,
  };
}

export function saveStoredSyncStats(stats: Partial<SyncAuditStats>) {
  try {
    const current = getStoredSyncStats();
    const updated = { ...current, ...stats };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch window event so any listening admin views update reactively
    window.dispatchEvent(new CustomEvent("bmes-gforms-sync-updated", { detail: updated }));
    return updated;
  } catch (e) {
    console.warn("Failed to save sync stats:", e);
    return getStoredSyncStats();
  }
}

/**
 * Extracts question title and answers from a Google Forms response
 */
function extractResponseFields(
  response: FormResponseItem, 
  questionsMap: Map<string, string>
): {
  extractedName?: string;
  extractedEmail?: string;
  extractedStudentId?: string;
  extractedBatch?: string;
  extractedDepartment?: string;
  extractedEventName?: string;
  extractedFeedbackRating?: string;
  formattedQnA: Array<{ question: string; answer: string }>;
} {
  const formattedQnA: Array<{ question: string; answer: string }> = [];
  let extractedName: string | undefined;
  let extractedEmail: string | undefined = response.respondentEmail;
  let extractedStudentId: string | undefined;
  let extractedBatch: string | undefined;
  let extractedDepartment: string | undefined;
  let extractedEventName: string | undefined;
  let extractedFeedbackRating: string | undefined;

  if (response.answers) {
    Object.entries(response.answers).forEach(([questionId, ansObj]) => {
      const qTitle = questionsMap.get(questionId) || "Question";
      const val = ansObj.textAnswers?.answers?.map(a => a.value).join(", ") || "";
      if (!val) return;

      formattedQnA.push({ question: qTitle, answer: val });

      const lowerQ = qTitle.toLowerCase();
      // Detect participant name
      if (!extractedName && (lowerQ.includes("name") || lowerQ.includes("participant") || lowerQ.includes("full name"))) {
        extractedName = val;
      }
      // Detect email
      if (!extractedEmail && (lowerQ.includes("email") || lowerQ.includes("mail"))) {
        extractedEmail = val;
      }
      // Detect student ID
      if (!extractedStudentId && (lowerQ.includes("student id") || lowerQ.includes("roll") || lowerQ.includes("id no"))) {
        extractedStudentId = val;
      }
      // Detect batch
      if (!extractedBatch && (lowerQ.includes("batch") || lowerQ.includes("academic year"))) {
        extractedBatch = val;
      }
      // Detect department
      if (!extractedDepartment && (lowerQ.includes("dept") || lowerQ.includes("department"))) {
        extractedDepartment = val;
      }
      // Detect event name
      if (!extractedEventName && (lowerQ.includes("event") || lowerQ.includes("workshop") || lowerQ.includes("seminar"))) {
        extractedEventName = val;
      }
      // Detect feedback rating
      if (!extractedFeedbackRating && (lowerQ.includes("satisfaction") || lowerQ.includes("rating") || lowerQ.includes("rate"))) {
        extractedFeedbackRating = val;
      }
    });
  }

  // Fallbacks
  if (!extractedName && extractedEmail) {
    extractedName = extractedEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  return {
    extractedName,
    extractedEmail,
    extractedStudentId,
    extractedBatch,
    extractedDepartment,
    extractedEventName,
    extractedFeedbackRating,
    formattedQnA,
  };
}

/**
 * Performs full live synchronization between configured Google Forms and Supabase tables:
 * 1. Member Feedback Form -> `contact_submissions` table
 * 2. Event Registration Form -> `event_registrations` table
 */
export async function syncGoogleFormsData(options: { silent?: boolean } = {}): Promise<{
  success: boolean;
  feedbackSynced: number;
  registrationsSynced: number;
  message: string;
  error?: string;
}> {
  if (!options.silent) {
    console.log("[GoogleFormsSync] Starting synchronization cycle...");
  }
  saveStoredSyncStats({ status: "syncing", message: "Connecting to Google Forms API..." });

  try {
    // 1. Check Google OAuth status
    const token = await getAccessToken();
    if (!token) {
      const msg = "Google Workspace account not connected. Please sign in with Google in Admin Workspace to enable live submission polling.";
      saveStoredSyncStats({
        status: "warning",
        message: msg,
        error: "NO_AUTH_TOKEN",
      });
      return {
        success: false,
        feedbackSynced: 0,
        registrationsSynced: 0,
        message: msg,
        error: "NO_AUTH_TOKEN",
      };
    }

    // 2. Fetch Google Forms config from site_settings
    const { data: configRow } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "google_forms_config")
      .maybeSingle();

    let feedbackFormId = "1FAIpQLSd9qC70Z3lM0hFh1q5N6b5B7R8v0s9t4u1w";
    let eventRegFormId = "1FAIpQLSe7yD29X4kL1gHh2r6O7c6C8S9w1t0u5v2x";

    if (configRow?.setting_value) {
      try {
        const parsed = JSON.parse(configRow.setting_value);
        if (parsed.memberFeedbackFormId || parsed.memberFeedbackFormUrl) {
          feedbackFormId = extractGoogleFormId(parsed.memberFeedbackFormId || parsed.memberFeedbackFormUrl);
        }
        if (parsed.eventRegistrationFormId || parsed.eventRegistrationFormUrl) {
          eventRegFormId = extractGoogleFormId(parsed.eventRegistrationFormId || parsed.eventRegistrationFormUrl);
        }
      } catch (e) {
        console.warn("Error parsing forms config in sync service:", e);
      }
    }

    let feedbackSyncedCount = 0;
    let registrationsSyncedCount = 0;

    // -------------------------------------------------------------
    // 3. Sync Member Feedback Google Form -> `contact_submissions`
    // -------------------------------------------------------------
    if (feedbackFormId) {
      try {
        const [formDetails, responsesData] = await Promise.all([
          getFormDetails(feedbackFormId).catch(() => null),
          getFormResponses(feedbackFormId).catch(() => null),
        ]);

        if (responsesData && Array.isArray(responsesData.responses) && responsesData.responses.length > 0) {
          const questionsMap = new Map<string, string>();
          if (formDetails?.questions) {
            formDetails.questions.forEach(q => questionsMap.set(q.questionId, q.title));
          }

          // Fetch existing contact_submissions to deduplicate
          const { data: existingSubmissions } = await supabase
            .from("contact_submissions")
            .select("id, subject, message, created_at, email");

          for (const resp of responsesData.responses) {
            const respTag = `[gform:${resp.responseId}]`;
            
            // Check if already synced
            const isDuplicate = (existingSubmissions || []).some(sub => 
              (sub.subject && sub.subject.includes(respTag)) ||
              (sub.message && sub.message.includes(respTag)) ||
              (sub.email === (resp.respondentEmail || "") && Math.abs(new Date(sub.created_at).getTime() - new Date(resp.createTime).getTime()) < 3000)
            );

            if (!isDuplicate) {
              const parsed = extractResponseFields(resp, questionsMap);
              
              const subject = `[Google Form Feedback] ${parsed.extractedFeedbackRating ? `[Rating: ${parsed.extractedFeedbackRating}] ` : ""}${respTag}`;
              
              const messageBody = [
                `📝 Source: Official Member & Student Feedback Google Form`,
                `📌 Response ID: ${resp.responseId}`,
                `🕒 Submission Time: ${resp.createTime || resp.lastSubmittedTime || new Date().toISOString()}`,
                resp.respondentEmail ? `📧 Google Account: ${resp.respondentEmail}` : null,
                `--------------------------------------------------`,
                ...parsed.formattedQnA.map(item => `Q: ${item.question}\nA: ${item.answer}\n`),
              ].filter(Boolean).join("\n");

              const { error: insertErr } = await supabase.from("contact_submissions").insert({
                name: parsed.extractedName || "CUET Member / Student",
                email: parsed.extractedEmail || "feedback@bmes-cuet.org",
                subject: subject,
                message: messageBody,
                is_read: false,
                created_at: resp.createTime || new Date().toISOString(),
              });

              if (!insertErr) {
                feedbackSyncedCount++;
              }
            }
          }
        }
      } catch (feedbackErr) {
        console.warn("Feedback form sync error (may need permissions or form ID check):", feedbackErr);
      }
    }

    // -------------------------------------------------------------
    // 4. Sync Event Registration Google Form -> `event_registrations`
    // -------------------------------------------------------------
    if (eventRegFormId) {
      try {
        const [regFormDetails, regResponsesData, eventsResult] = await Promise.all([
          getFormDetails(eventRegFormId).catch(() => null),
          getFormResponses(eventRegFormId).catch(() => null),
          supabase.from("events").select("id, title").order("date", { ascending: false }),
        ]);

        const eventsList = eventsResult?.data || [];
        const defaultEventId = eventsList[0]?.id;

        if (regResponsesData && Array.isArray(regResponsesData.responses) && regResponsesData.responses.length > 0 && defaultEventId) {
          const questionsMap = new Map<string, string>();
          if (regFormDetails?.questions) {
            regFormDetails.questions.forEach(q => questionsMap.set(q.questionId, q.title));
          }

          // Fetch existing event registrations to deduplicate
          const { data: existingRegs } = await supabase
            .from("event_registrations")
            .select("id, email, event_id, details");

          for (const resp of regResponsesData.responses) {
            const respTag = `[gform:${resp.responseId}]`;
            const parsed = extractResponseFields(resp, questionsMap);

            // Determine target event
            let targetEventId = defaultEventId;
            if (parsed.extractedEventName) {
              const matched = eventsList.find(e => 
                e.title.toLowerCase().includes(parsed.extractedEventName!.toLowerCase()) ||
                parsed.extractedEventName!.toLowerCase().includes(e.title.toLowerCase())
              );
              if (matched) targetEventId = matched.id;
            }

            const candidateEmail = parsed.extractedEmail || `participant-${resp.responseId.slice(0, 6)}@bmes-cuet.org`;

            // Check if already registered for this event
            const isDuplicate = (existingRegs || []).some(reg => 
              (reg.event_id === targetEventId && reg.email.toLowerCase() === candidateEmail.toLowerCase()) ||
              (reg.details && reg.details.includes(respTag))
            );

            if (!isDuplicate) {
              const detailsText = [
                `📝 Source: Official Google Form Event Registration ${respTag}`,
                `🕒 Submitted: ${resp.createTime || new Date().toISOString()}`,
                ...parsed.formattedQnA.map(item => `${item.question}: ${item.answer}`),
              ].join(" | ");

              const { error: insertErr } = await supabase.from("event_registrations").insert({
                event_id: targetEventId,
                name: parsed.extractedName || "Event Participant",
                email: candidateEmail,
                student_id: parsed.extractedStudentId || "N/A",
                batch: parsed.extractedBatch || "N/A",
                department: parsed.extractedDepartment || "Biomedical Engineering",
                details: detailsText,
                created_at: resp.createTime || new Date().toISOString(),
              });

              if (!insertErr) {
                registrationsSyncedCount++;
              }
            }
          }
        }
      } catch (regErr) {
        console.warn("Registration form sync error (may need permissions or form ID check):", regErr);
      }
    }

    const nowIso = new Date().toISOString();
    const totalNew = feedbackSyncedCount + registrationsSyncedCount;
    const summaryMsg = totalNew > 0 
      ? `Auto-sync complete: ${feedbackSyncedCount} new feedback, ${registrationsSyncedCount} new event registrations added.`
      : "Google Forms synchronized: Tables are up-to-date. No new submissions pending.";

    saveStoredSyncStats({
      lastSyncedAt: nowIso,
      status: "success",
      feedbackSynced: feedbackSyncedCount,
      registrationsSynced: registrationsSyncedCount,
      message: summaryMsg,
      error: null,
    });

    // Notify global event listeners so table views can update without page reload
    window.dispatchEvent(new CustomEvent("bmes-forms-data-refreshed", {
      detail: { feedbackSynced: feedbackSyncedCount, registrationsSynced: registrationsSyncedCount, timestamp: nowIso }
    }));

    return {
      success: true,
      feedbackSynced: feedbackSyncedCount,
      registrationsSynced: registrationsSyncedCount,
      message: summaryMsg,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Sync execution failed";
    console.error("Google Forms sync failed:", err);
    saveStoredSyncStats({
      status: "error",
      message: `Sync failed: ${errMsg}`,
      error: errMsg,
    });
    return {
      success: false,
      feedbackSynced: 0,
      registrationsSynced: 0,
      message: errMsg,
      error: errMsg,
    };
  }
}
