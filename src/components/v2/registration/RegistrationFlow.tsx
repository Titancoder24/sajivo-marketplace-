"use client";

import { ArrowLeft, ArrowRight, Check, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { AccountStep } from "./AccountStep";
import { BusinessDetailsStep } from "./BusinessDetailsStep";
import { RegistrationShell } from "./RegistrationShell";
import { ReviewStep } from "./ReviewStep";
import { RoleTeamStep } from "./RoleTeamStep";
import type { RegistrationData, RegistrationErrors } from "./types";
import { VerificationStep } from "./VerificationStep";

const initialData: RegistrationData = {
  accountType: "business", businessUse: "professional", professionalRole: "interior_designer", vendorRole: "retailer",
  fullName: "", email: "", mobile: "", password: "", terms: false,
  companyName: "", brandName: "", businessType: "", registrationType: "", pan: "", gstStatus: "registered", gstin: "", established: "", category: "", subcategory: "",
  address1: "", address2: "", city: "", state: "", pincode: "", serviceLocations: [], businessEmail: "", alternateMobile: "", website: "",
  accountHolder: "", bankName: "", accountNumber: "", ifsc: "", about: "", goals: "", serviceCategories: ["Interior Execution"],
  teamMembers: [{ id: 1, role: "Team Leader", name: "", mobile: "", email: "" }, { id: 2, role: "Site Supervisor", name: "", mobile: "", email: "" }],
  activeProjects: "0 - 2", maxProjects: "5 - 10", projectValue: "₹5L - ₹20L", tools: ["Own Tools", "On-site Team"], additionalInfo: "",
  idType: "aadhaar", idName: "", idNumber: "", addressDocument: "", documentAddress: "", documentDate: "",
};

function validate(step: number, data: RegistrationData): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (step === 1) {
    if (data.fullName.trim().length < 2) errors.fullName = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(data.email)) errors.email = "Enter a valid email address";
    if (!/^\+?[0-9\s-]{10,15}$/.test(data.mobile)) errors.mobile = "Enter a valid mobile number";
    if (data.password.length < 8 || !/[A-Z]/.test(data.password) || !/[0-9]/.test(data.password) || !/[^A-Za-z0-9]/.test(data.password)) errors.password = "Use 8+ characters with uppercase, number and symbol";
    if (!data.terms) errors.terms = "Accept the terms and privacy policy to continue";
  }
  if (step === 2) {
    [["companyName", data.companyName, "Enter your registered business name"], ["businessType", data.businessType, "Select a business type"], ["registrationType", data.registrationType, "Select a registration type"], ["category", data.category, "Select a category"], ["subcategory", data.subcategory, "Select a sub category"], ["address1", data.address1, "Enter the business address"], ["city", data.city, "Enter the city"], ["state", data.state, "Select a state"], ["businessEmail", data.businessEmail, "Enter the business email"], ["accountHolder", data.accountHolder, "Enter the account holder name"], ["bankName", data.bankName, "Enter the bank name"], ["accountNumber", data.accountNumber, "Enter the account number"], ["ifsc", data.ifsc, "Enter the IFSC code"], ["about", data.about, "Add a short business introduction"]].forEach(([key, value, message]) => { if (!value.trim()) errors[key] = message; });
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(data.pan.toUpperCase())) errors.pan = "Use a valid PAN format, e.g. AABCA1234B";
    if (data.gstStatus === "registered" && !/^[0-9]{2}[A-Z0-9]{13}$/.test(data.gstin.toUpperCase())) errors.gstin = "Enter a valid 15-character GSTIN";
    if (!/^\d{6}$/.test(data.pincode)) errors.pincode = "Enter a valid 6-digit PIN code";
    if (!/^\S+@\S+\.\S+$/.test(data.businessEmail)) errors.businessEmail = "Enter a valid business email";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifsc.toUpperCase())) errors.ifsc = "Use a valid IFSC format";
  }
  if (step === 3) {
    if (!data.serviceCategories.length) errors.serviceCategories = "Select at least one category";
    if (data.teamMembers.length < 2) errors.teamMembers = "Add at least two team members";
    else if (data.teamMembers.some((member) => !member.name.trim() || !/^\+?[0-9\s-]{10,15}$/.test(member.mobile) || !/^\S+@\S+\.\S+$/.test(member.email))) errors.teamMembers = "Complete each member's name, mobile number, and email";
  }
  if (step === 4) {
    [["idName", data.idName, "Enter the name shown on the ID"], ["idNumber", data.idNumber, "Enter the ID number"], ["addressDocument", data.addressDocument, "Select an address document"], ["documentAddress", data.documentAddress, "Enter the address shown on the document"]].forEach(([key, value, message]) => { if (!value.trim()) errors[key] = message; });
  }
  return errors;
}

export function RegistrationFlow() {
  const [data, setData] = useState(initialData);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);
  const client = data.accountType === "client";

  function update<K extends keyof RegistrationData>(key: K, value: RegistrationData[K]) {
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => { const next = { ...current }; delete next[String(key)]; return next; });
  }
  function goTo(nextStep: number) { setErrors({}); setStep(nextStep); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function next() {
    const nextErrors = validate(step, data);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    if (client && step === 1) goTo(5); else goTo(Math.min(5, step + 1));
  }
  function back() { if (client && step === 5) goTo(1); else goTo(Math.max(1, step - 1)); }

  async function submitRegistration() {
    setSubmitting(true);
    setSubmitError("");
    const businessType = client ? null : data.businessUse === "vendor" ? "vendor" : "professional";
    const businessRole = client ? null : businessType === "vendor" ? "retailer" : data.professionalRole;
    const role = client ? "customer" : businessRole === "retailer" ? "vendor" : businessRole === "contractor" ? "contractor" : "designer";

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          accountType: data.accountType,
          businessType,
          businessRole,
          role,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to create your account");
      setRequiresEmailConfirmation(Boolean(result.requiresEmailConfirmation));
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create your account");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) return <RegistrationShell step={5} client={client}><div className="grid min-h-[560px] place-items-center p-6 text-center"><div className="max-w-md"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e9f8ef] text-[#34aa59]"><Check size={32} strokeWidth={3} /></span><h2 className="mt-5 text-[24px] font-extrabold">Account created</h2><p className="mt-2 text-[13px] leading-6 text-[#666]">Thanks, {data.fullName}. Your {client ? "client" : "business"} account is connected to Sajivo.{requiresEmailConfirmation ? " Check your email to confirm your address before signing in." : " You can sign in now."}</p><a href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[5px] bg-[#e74925] px-5 text-[12px] font-bold text-white shadow-[0_2px_0_#b73518]">Continue to login</a></div></div></RegistrationShell>;

  return <RegistrationShell step={step} client={client}><form onSubmit={(event) => event.preventDefault()} noValidate>{step === 1 && <AccountStep data={data} errors={errors} update={update} />}{step === 2 && <BusinessDetailsStep data={data} errors={errors} update={update} />}{step === 3 && <RoleTeamStep data={data} errors={errors} update={update} />}{step === 4 && <VerificationStep data={data} errors={errors} update={update} />}{step === 5 && <ReviewStep data={data} edit={goTo} />}{submitError && <p role="alert" className="mx-4 mb-3 rounded-[5px] border border-[#f1b7aa] bg-[#fff4f1] px-4 py-3 text-[11px] font-semibold text-[#a52f19] sm:mx-6">{submitError}</p>}<div className="sticky bottom-0 z-20 flex items-center gap-3 border-t border-[#e6e6e6] bg-white/95 p-4 backdrop-blur sm:px-6">{step > 1 && <button type="button" onClick={back} disabled={submitting} className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-[5px] border border-[#d8d8d8] bg-white px-4 text-[12px] font-bold hover:bg-[#fafafa] disabled:opacity-50"><ArrowLeft size={16} />Back</button>}<button type="button" disabled={submitting} onClick={step === 5 ? submitRegistration : next} className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-[5px] bg-[#e74925] px-4 text-center text-[12px] font-bold text-white shadow-[0_2px_0_#b73518] hover:bg-[#d9401e] disabled:cursor-wait disabled:opacity-70">{submitting ? "Creating account..." : step === 5 ? "Submit & Activate My Account" : client ? "Continue to Review" : ["", "Continue to Business Details", "Continue to Role & Team", "Continue to Verification", "Continue to Review & Submit"][step]}<ArrowRight size={16} className="shrink-0" /></button></div><div className="flex items-center justify-center gap-1.5 pb-3 text-[9px] text-[#888]"><LockKeyhole size={11} />Your data is protected with secure transmission and Supabase authentication.</div></form></RegistrationShell>;
}
