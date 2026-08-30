import type { Metadata } from "next";
import { AngelSupport } from "@/components/v2/support/AngelSupport";

export const metadata: Metadata = { title: "Angel AI Support | Sajivo", description: "Account-aware Sajivo AI support with human handoff and callback scheduling." };

export default function AngelSupportPage() { return <AngelSupport />; }
