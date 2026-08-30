import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/AuthForms";

export default function RegisterPage() {
  return (
    <section className="page-shell grid min-h-[calc(100vh-180px)] place-items-center py-14">
      <Card className="w-full max-w-3xl">
        <CardContent>
          <h1 className="font-display text-3xl">Create your Sajivo account</h1>
          <p className="mt-2 text-sm text-[var(--rv-ink-2)]">Start with a client or business account. Business users then activate a phase-one professional or vendor role.</p>
          <div className="mt-6">
            <Suspense><RegisterForm /></Suspense>
          </div>
          <p className="mt-5 text-center text-sm text-[var(--rv-ink-2)]">Already have an account? <Link href="/login" className="font-bold text-[var(--rv-ink)] underline underline-offset-4">Log in</Link></p>
        </CardContent>
      </Card>
    </section>
  );
}
