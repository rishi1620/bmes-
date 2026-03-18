import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminCrudPage, { FieldDef } from "@/components/admin/AdminCrudPage";

const fields: FieldDef[] = [
  { key: "page_name", label: "Page Name", required: true },
  { key: "slug", label: "Slug (e.g. /about)", required: true },
  { key: "is_visible", label: "Visible", type: "boolean" },
  { key: "display_order", label: "Display Order", type: "number" },
];

const corePages = [
  { page_name: "Home", slug: "/", display_order: 1 },
  { page_name: "About Us", slug: "/about", display_order: 2 },
  { page_name: "Academics", slug: "/academics", display_order: 3 },
  { page_name: "People", slug: "/people", display_order: 4 },
  { page_name: "Research", slug: "/research", display_order: 5 },
  { page_name: "Activities", slug: "/activities", display_order: 6 },
  { page_name: "Portal", slug: "/portal", display_order: 7 },
  { page_name: "Notices", slug: "/notices", display_order: 8 },
  { page_name: "Achievements", slug: "/achievements", display_order: 9 },
  { page_name: "Blog", slug: "/blog", display_order: 10 },
  { page_name: "Alumni", slug: "/alumni", display_order: 11 },
  { page_name: "Contact", slug: "/contact", display_order: 12 },
];

const AdminPages = () => {
  useEffect(() => {
    const ensureCorePages = async () => {
      const { data: existingPages } = await supabase.from("pages").select("slug");
      const existingSlugs = new Set(existingPages?.map(p => p.slug) || []);

      const missingPages = corePages.filter(p => !existingSlugs.has(p.slug));

      if (missingPages.length > 0) {
        await supabase.from("pages").insert(missingPages.map(p => ({
          ...p,
          is_visible: true
        })));
        // Refreshing the page to show new items might be needed, 
        // but AdminCrudPage likely uses a query that will pick them up on next fetch
        // or we can just let the user refresh.
      }
    };

    ensureCorePages();
  }, []);

  return (
    <AdminCrudPage 
      tableName="pages" 
      title="Pages / Navigation" 
      fields={fields} 
      columns={["page_name", "slug", "is_visible", "display_order"]} 
      orderBy="display_order" 
    />
  );
};

export default AdminPages;
