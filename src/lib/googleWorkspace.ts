import { getAccessToken } from "./googleAuth";

// Types for Google Drive
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
}

// Types for Google Calendar
export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export interface CreateCalendarEventPayload {
  summary: string;
  description?: string;
  location?: string;
  startDate: string; // YYYY-MM-DD or ISO string
  endDate?: string;
  startTime?: string; // HH:mm
  endTime?: string;
}

// Types for Google Forms
export interface GoogleFormItem {
  id: string;
  title: string;
  documentTitle?: string;
  responderUri?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface FormQuestionItem {
  questionId: string;
  title: string;
  description?: string;
  type?: string;
}

export interface GoogleFormFullDetails {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  responderUri?: string;
  questions: FormQuestionItem[];
}

export interface FormResponseItem {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  respondentEmail?: string;
  answers?: Record<string, {
    questionId: string;
    textAnswers?: { answers: { value: string }[] };
  }>;
}

/**
 * Ensure an access token is present before calling Google Workspace APIs
 */
async function requireAuthHeader(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Google Workspace authentication required. Please sign in with your Google Account.");
  }
  return {
    Authorization: `Bearer ${token}`
  };
}

/* =========================================================================
   1. GOOGLE DRIVE API HELPERS
   ========================================================================= */

/**
 * List files from Google Drive
 */
export async function listDriveFiles(customQuery?: string): Promise<DriveFile[]> {
  const headers = await requireAuthHeader();
  const q = customQuery 
    ? `trashed=false and (${customQuery})` 
    : "trashed=false and mimeType != 'application/vnd.google-apps.folder'";

  const fields = "files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,thumbnailLink,iconLink)";
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=50&q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&orderBy=modifiedTime desc`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to fetch Drive files (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Upload a local file (PDF, Image, Document) directly to Google Drive
 */
export async function uploadFileToDrive(file: File, folderId?: string): Promise<DriveFile> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Authentication required to upload to Google Drive");
  }

  const metadata: Record<string, unknown> = {
    name: file.name,
    mimeType: file.type || "application/octet-stream"
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", file);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,createdTime,modifiedTime", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to upload file to Google Drive (${res.status})`);
  }

  return await res.json();
}

/**
 * Delete a file from Google Drive (Mandatory user confirmation should be handled in UI before calling)
 */
export async function deleteDriveFile(fileId: string): Promise<void> {
  const headers = await requireAuthHeader();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to delete file from Google Drive (${res.status})`);
  }
}

/* =========================================================================
   2. GOOGLE CALENDAR API HELPERS
   ========================================================================= */

/**
 * List events from primary Google Calendar
 */
export async function listCalendarEvents(daysBack = 15, daysForward = 90): Promise<CalendarEventItem[]> {
  const headers = await requireAuthHeader();
  
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - daysBack);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + daysForward);

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    minDate.toISOString()
  )}&timeMax=${encodeURIComponent(
    maxDate.toISOString()
  )}&singleEvents=true&orderBy=startTime&maxResults=50`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to fetch Google Calendar events (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Create an event in primary Google Calendar
 */
export async function createCalendarEvent(payload: CreateCalendarEventPayload): Promise<CalendarEventItem> {
  const headers = await requireAuthHeader();

  const isAllDay = !payload.startTime;
  const start: Record<string, string> = isAllDay
    ? { date: payload.startDate }
    : { dateTime: new Date(`${payload.startDate}T${payload.startTime}:00`).toISOString() };

  const endDay = payload.endDate || payload.startDate;
  const end: Record<string, string> = isAllDay
    ? { date: endDay }
    : { dateTime: new Date(`${endDay}T${payload.endTime || payload.startTime || "23:59"}:00`).toISOString() };

  const body = {
    summary: payload.summary,
    description: payload.description || "CUET Biomedical Engineering Society Event",
    location: payload.location || "Chittagong University of Engineering & Technology (CUET)",
    start,
    end
  };

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to create Google Calendar event (${res.status})`);
  }

  return await res.json();
}

/* =========================================================================
   3. GOOGLE FORMS API HELPERS
   ========================================================================= */

/**
 * List existing Google Forms owned by the authenticated user via Drive API
 */
export async function listGoogleForms(): Promise<GoogleFormItem[]> {
  const headers = await requireAuthHeader();
  const q = "mimeType='application/vnd.google-apps.form' and trashed=false";
  const fields = "files(id,name,createdTime,modifiedTime,webViewLink)";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&orderBy=modifiedTime desc`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to list Google Forms (${res.status})`);
  }

  const data = await res.json();
  return (data.files || []).map((f: { id: string; name: string; createdTime: string; modifiedTime: string; webViewLink: string }) => ({
    id: f.id,
    title: f.name,
    createdTime: f.createdTime,
    modifiedTime: f.modifiedTime,
    webViewLink: f.webViewLink
  }));
}

/**
 * Create a new Google Form via Google Forms API v1
 */
export async function createGoogleForm(title: string, description?: string): Promise<{ formId: string; responderUri: string; title: string }> {
  const headers = await requireAuthHeader();

  const body = {
    info: {
      title,
      documentTitle: title
    }
  };

  const res = await fetch("https://forms.googleapis.com/v1/forms", {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to create Google Form (${res.status})`);
  }

  const data = await res.json();
  const formId = data.formId;

  // Add initial question if description provided or basic contact field
  if (description) {
    try {
      await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              updateFormInfo: {
                info: {
                  description
                },
                updateMask: "description"
              }
            }
          ]
        })
      });
    } catch {
      // Non-critical if description update fails
    }
  }

  return {
    formId,
    responderUri: data.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`,
    title: data.info?.title || title
  };
}

/**
 * Get responses for a specific Google Form
 */
export async function getFormResponses(formId: string): Promise<{ total: number; responses: FormResponseItem[] }> {
  const headers = await requireAuthHeader();
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to fetch responses for Google Form (${res.status})`);
  }

  const data = await res.json();
  return {
    total: (data.responses || []).length,
    responses: data.responses || []
  };
}

/**
 * Get full details of a Google Form including its questions schema
 */
export async function getFormDetails(formId: string): Promise<GoogleFormFullDetails> {
  const headers = await requireAuthHeader();
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to fetch Google Form details (${res.status})`);
  }

  const data = await res.json();
  const questions: FormQuestionItem[] = [];

  if (Array.isArray(data.items)) {
    data.items.forEach((item: { title?: string; description?: string; questionItem?: { question?: { questionId: string; choiceQuestion?: unknown; textQuestion?: unknown } }; questionGroupItem?: { questions?: { questionId: string; title?: string; description?: string }[] } }) => {
      if (item.questionItem?.question) {
        questions.push({
          questionId: item.questionItem.question.questionId,
          title: item.title || "Untitled Question",
          description: item.description,
          type: item.questionItem.question.choiceQuestion ? "choice" : item.questionItem.question.textQuestion ? "text" : "other"
        });
      } else if (item.questionGroupItem?.questions) {
        item.questionGroupItem.questions.forEach((q) => {
          questions.push({
            questionId: q.questionId,
            title: `${item.title || "Question"} - ${q.title || ""}`,
            description: q.description
          });
        });
      }
    });
  }

  return {
    formId: data.formId,
    info: data.info || { title: "Untitled Form" },
    responderUri: data.responderUri,
    questions
  };
}

/**
 * Helper to extract Google Form ID from a share/edit/view link or return clean ID
 */
export function extractGoogleFormId(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed.startsWith("http")) return trimmed;
  // Match forms/d/e/([a-zA-Z0-9_-]+) or forms/d/([a-zA-Z0-9_-]+)
  const match = trimmed.match(/\/forms\/d\/(?:e\/)?([a-zA-Z0-9_-]+)/);
  return match ? match[1] : trimmed;
}

/**
 * Convert any Google Forms link into an embeddable iframe URL with embedded=true
 */
export function getEmbeddableGoogleFormUrl(urlOrId: string): string {
  if (!urlOrId) return "";
  let clean = urlOrId.trim();
  if (!clean.startsWith("http")) {
    return `https://docs.google.com/forms/d/e/${clean}/viewform?embedded=true`;
  }
  if (clean.includes("/edit")) {
    clean = clean.replace(/\/edit.*$/, "/viewform");
  }
  if (!clean.includes("embedded=true")) {
    clean += clean.includes("?") ? "&embedded=true" : "?embedded=true";
  }
  return clean;
}

/**
 * Generate a pre-configured official BMES CUET Member Feedback Google Form
 */
export async function createPreconfiguredFeedbackForm(): Promise<{ formId: string; responderUri: string; title: string }> {
  const form = await createGoogleForm(
    "BMES CUET - Member Feedback & Department Suggestions",
    "Official feedback survey for Biomedical Engineering Society (BMES), CUET students, faculty, and society members."
  );

  const headers = await requireAuthHeader();
  try {
    await fetch(`https://forms.googleapis.com/v1/forms/${form.formId}:batchUpdate`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            createItem: {
              item: {
                title: "Full Name (Optional - leave blank for anonymous)",
                questionItem: { question: { textQuestion: { paragraph: false } } }
              },
              location: { index: 0 }
            }
          },
          {
            createItem: {
              item: {
                title: "Student ID / Batch / Designation",
                questionItem: { question: { textQuestion: { paragraph: false } } }
              },
              location: { index: 1 }
            }
          },
          {
            createItem: {
              item: {
                title: "Overall Satisfaction with BMES Society Activities",
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: "RADIO",
                      options: [
                        { value: "Excellent (5/5)" },
                        { value: "Very Good (4/5)" },
                        { value: "Good (3/5)" },
                        { value: "Fair (2/5)" },
                        { value: "Needs Improvement (1/5)" }
                      ]
                    }
                  }
                }
              },
              location: { index: 2 }
            }
          },
          {
            createItem: {
              item: {
                title: "What workshops, seminars, or lab training would you like BMES to organize next?",
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: { paragraph: true }
                  }
                }
              },
              location: { index: 3 }
            }
          },
          {
            createItem: {
              item: {
                title: "Additional Suggestions, Criticisms, or General Feedback",
                questionItem: {
                  question: {
                    textQuestion: { paragraph: true }
                  }
                }
              },
              location: { index: 4 }
            }
          }
        ]
      })
    });
  } catch (err) {
    console.warn("Batch question update error:", err);
  }

  return form;
}

/**
 * Generate a pre-configured official Event Registration Google Form
 */
export async function createPreconfiguredEventRegistrationForm(eventTitle = "Upcoming BMES Event"): Promise<{ formId: string; responderUri: string; title: string }> {
  const form = await createGoogleForm(
    `Registration: ${eventTitle} [BMES CUET]`,
    `Official event registration form for "${eventTitle}" organized by Biomedical Engineering Society, CUET.`
  );

  const headers = await requireAuthHeader();
  try {
    await fetch(`https://forms.googleapis.com/v1/forms/${form.formId}:batchUpdate`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            createItem: {
              item: {
                title: "Participant Full Name",
                questionItem: { question: { required: true, textQuestion: { paragraph: false } } }
              },
              location: { index: 0 }
            }
          },
          {
            createItem: {
              item: {
                title: "Email Address",
                questionItem: { question: { required: true, textQuestion: { paragraph: false } } }
              },
              location: { index: 1 }
            }
          },
          {
            createItem: {
              item: {
                title: "Student ID / Institution Roll",
                questionItem: { question: { required: true, textQuestion: { paragraph: false } } }
              },
              location: { index: 2 }
            }
          },
          {
            createItem: {
              item: {
                title: "Department & Academic Batch",
                questionItem: { question: { required: true, textQuestion: { paragraph: false } } }
              },
              location: { index: 3 }
            }
          },
          {
            createItem: {
              item: {
                title: "Contact / WhatsApp Number",
                questionItem: { question: { required: true, textQuestion: { paragraph: false } } }
              },
              location: { index: 4 }
            }
          }
        ]
      })
    });
  } catch (err) {
    console.warn("Batch event question update error:", err);
  }

  return form;
}
