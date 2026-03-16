import AdminCrudPage from "@/components/admin/AdminCrudPage";

const AdminFAQ = () => {
  return (
    <AdminCrudPage
      tableName={"faqs" as never}
      title="FAQs"
      columns={["question", "answer", "display_order"]}
      orderBy="display_order"
      fields={[
        { key: "question", label: "Question", type: "text", required: true },
        { key: "answer", label: "Answer", type: "textarea", required: true },
        { key: "display_order", label: "Display Order", type: "number" },
      ]}
    />
  );
};

export default AdminFAQ;
