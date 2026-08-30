import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/AuthForms";

export default function LoginPage() {
  return (
    <section className="page-shell grid min-h-[calc(100vh-180px)] place-items-center py-14">
      <Card className="w-full max-w-md">
        <CardContent>
          <h1 className="font-display text-3xl">Login to Sajivo</h1>
          <p className="mt-2 text-sm text-[var(--rv-ink-2)]">Use your customer, designer, or contractor account.</p>
          <div className="mt-6"><LoginForm /></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><Link href="/forgot-password" className="font-semibold text-[var(--rv-terracotta)]">Forgot password?</Link><span className="text-[var(--rv-ink-2)]">New to Sajivo? <Link href="/register" className="font-bold text-[var(--rv-ink)] underline underline-offset-4">Create account</Link></span></div>
        </CardContent>
      </Card>
    </section>
  );
}
