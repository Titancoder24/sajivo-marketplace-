"use client";

import { Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";

type Contact = { phoneNumber: string | null; emailAddress: string | null };

export function GlobalLeadContact() {
  const [contact, setContact] = useState<Contact | null>(null);

  useEffect(() => {
    fetch("/api/v2/platform/contact", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setContact(payload))
      .catch(() => setContact({ phoneNumber: null, emailAddress: null }));
  }, []);

  if (!contact?.phoneNumber && !contact?.emailAddress) return null;
  return (
    <div className="border-b border-black/10 bg-[#17211d] text-white">
      <div className="page-shell flex min-h-9 flex-wrap items-center justify-end gap-x-5 gap-y-1 py-2 text-xs font-semibold">
        {contact.phoneNumber ? <a href={`tel:${contact.phoneNumber.replace(/[^+\d]/g, "")}`} className="flex items-center gap-1.5 hover:text-[#f0a28e]"><Phone size={13} />{contact.phoneNumber}</a> : null}
        {contact.emailAddress ? <a href={`mailto:${contact.emailAddress}`} className="flex items-center gap-1.5 hover:text-[#f0a28e]"><Mail size={13} />{contact.emailAddress}</a> : null}
      </div>
    </div>
  );
}
