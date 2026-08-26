// Firebase-powered backend client adapter for the CUET BMES portal
import { firebaseAdapter } from "@/integrations/firebase/dataAdapter";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = firebaseAdapter;

export default supabase;
