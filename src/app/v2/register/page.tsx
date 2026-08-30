import type { Metadata } from "next";
import { RegistrationFlow } from "@/components/v2/registration/RegistrationFlow";

export const metadata: Metadata = {
  title: "Create your Sajivo account",
  description: "Register as a Sajivo client, professional, or vendor.",
};

export default function V2RegisterPage() {
  return <RegistrationFlow />;
}
