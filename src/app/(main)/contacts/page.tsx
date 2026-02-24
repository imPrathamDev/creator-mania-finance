import { ContactsTable } from "@/components/custom/tabsles/ContactsTable";
import React from "react";

const ContactPage = () => {
  return (
    <div className="p-6">
      <ContactsTable
      //   onCreateContact={() => setCreateOpen(true)}
      //   onEditContact={(contact) => { setEditTarget(contact); setEditOpen(true) }}
      />
    </div>
  );
};

export default ContactPage;
