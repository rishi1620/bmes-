import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getEmbeddableGoogleFormUrl, extractGoogleFormId } from "@/lib/googleWorkspace";
import { toast } from "sonner";

export interface GoogleFormsConfig {
  memberFeedbackFormUrl: string;
  memberFeedbackFormId: string;
  memberFeedbackTitle: string;
  memberFeedbackDescription: string;
  memberFeedbackEnabled: boolean;

  eventRegistrationFormUrl: string;
  eventRegistrationFormId: string;
  eventRegistrationTitle: string;
  eventRegistrationDescription: string;
  eventRegistrationEnabled: boolean;
}

export const DEFAULT_GOOGLE_FORMS_CONFIG: GoogleFormsConfig = {
  // Preconfigured default fallback forms (can be customized or created with 1-click in Admin Workspace)
  memberFeedbackFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSd9qC70Z3lM0hFh1q5N6b5B7R8v0s9t4u1w/viewform?embedded=true",
  memberFeedbackFormId: "1FAIpQLSd9qC70Z3lM0hFh1q5N6b5B7R8v0s9t4u1w",
  memberFeedbackTitle: "BMES CUET Member & Student Feedback Survey",
  memberFeedbackDescription: "Share your thoughts, suggestions, and workshop requests with the Biomedical Engineering Society executive committee.",
  memberFeedbackEnabled: true,

  eventRegistrationFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSe7yD29X4kL1gHh2r6O7c6C8S9w1t0u5v2x/viewform?embedded=true",
  eventRegistrationFormId: "1FAIpQLSe7yD29X4kL1gHh2r6O7c6C8S9w1t0u5v2x",
  eventRegistrationTitle: "Official Event Registration via Google Forms",
  eventRegistrationDescription: "Register for upcoming seminars, bio-design workshops, and society events through our official Google Form.",
  eventRegistrationEnabled: true,
};

export function useGoogleFormsConfig() {
  const [config, setConfig] = useState<GoogleFormsConfig>(DEFAULT_GOOGLE_FORMS_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "google_forms_config")
        .maybeSingle();

      if (error) {
        console.warn("Could not load google_forms_config from site_settings:", error);
        return;
      }

      if (data?.setting_value) {
        try {
          const parsed = JSON.parse(data.setting_value);
          setConfig((prev) => ({
            ...prev,
            ...parsed,
          }));
        } catch (e) {
          console.error("Failed to parse google_forms_config:", e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = async (newConfig: Partial<GoogleFormsConfig>): Promise<boolean> => {
    try {
      const merged: GoogleFormsConfig = {
        ...config,
        ...newConfig,
        // sanitize URLs and IDs
        memberFeedbackFormId: newConfig.memberFeedbackFormUrl
          ? extractGoogleFormId(newConfig.memberFeedbackFormUrl)
          : config.memberFeedbackFormId,
        memberFeedbackFormUrl: newConfig.memberFeedbackFormUrl
          ? getEmbeddableGoogleFormUrl(newConfig.memberFeedbackFormUrl)
          : config.memberFeedbackFormUrl,
        eventRegistrationFormId: newConfig.eventRegistrationFormUrl
          ? extractGoogleFormId(newConfig.eventRegistrationFormUrl)
          : config.eventRegistrationFormId,
        eventRegistrationFormUrl: newConfig.eventRegistrationFormUrl
          ? getEmbeddableGoogleFormUrl(newConfig.eventRegistrationFormUrl)
          : config.eventRegistrationFormUrl,
      };

      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("setting_key", "google_forms_config")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({
            setting_value: JSON.stringify(merged),
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", "google_forms_config");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({
          setting_group: "google_workspace",
          setting_key: "google_forms_config",
          setting_value: JSON.stringify(merged),
        });
        if (error) throw error;
      }

      setConfig(merged);
      toast.success("Google Forms configuration saved and synced with public website!");
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save Google Forms config";
      toast.error(msg);
      return false;
    }
  };

  return {
    config,
    isLoading,
    saveConfig,
    refreshConfig: fetchConfig,
  };
}
