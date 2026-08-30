import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Check, Heart, MapPin, MessageSquare, Share2, ShieldCheck, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { roleLabels } from "@/lib/constants";
import { formatCurrency, initials } from "@/lib/utils";
import { getPortfolioForProfessional, getProfessionals, getReviewsForProfessional } from "@/lib/server/repository";

const gallery = [
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=88",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=86",
];

export default async function PublicProPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const professionals = await getProfessionals();
  const professional = professionals.find((item) => item.id === id);
  if (!professional) notFound();
  const [portfolio, reviews] = await Promise.all([getPortfolioForProfessional(professional.id), getReviewsForProfessional(professional.id)]);
  const displayName = professional.businessName ?? professional.fullName;

  return (
    <>
      <section className="bg-white pt-6">
        <div className="page-shell">
          <div className="mb-5 flex items-center justify-between"><Link href="/professionals" className="flex items-center gap-2 text-sm font-semibold hover:text-[var(--rv-terracotta)]"><ArrowLeft size={17} /> Back to professionals</Link><div className="flex gap-2"><button className="flex h-10 items-center gap-2 rounded-full border border-[var(--rv-border)] px-4 text-sm font-semibold"><Share2 size={16} /> <span className="hidden sm:inline">Share</span></button><button className="flex h-10 items-center gap-2 rounded-full border border-[var(--rv-border)] px-4 text-sm font-semibold"><Heart size={16} /> <span className="hidden sm:inline">Save</span></button></div></div>
          <div className="grid h-[390px] grid-cols-2 gap-2 overflow-hidden rounded-lg sm:grid-cols-4 sm:grid-rows-2 md:h-[500px]">
            {gallery.map((image, index) => <div key={image} className={`relative overflow-hidden bg-[var(--rv-bg)] ${index === 0 ? "col-span-2 row-span-2" : index > 2 ? "hidden sm:block" : ""}`}><img src={image} alt={`${displayName} portfolio project ${index + 1}`} className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]" />{index === gallery.length - 1 ? <span className="absolute bottom-4 right-4 rounded-md bg-white px-4 py-2 text-sm font-bold shadow">View all photos</span> : null}</div>)}
          </div>
        </div>
      </section>

      <section className="bg-white pb-14 pt-8">
        <div className="page-shell grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex items-start justify-between gap-5 border-b border-[var(--rv-border)] pb-7">
              <div><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-3xl sm:text-4xl">{displayName}</h1>{professional.verificationStatus === "verified" ? <BadgeCheck className="fill-[var(--rv-moss)] text-white" size={23} /> : null}</div><p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--rv-ink-2)]"><span>{roleLabels[professional.primaryRole]}</span><span className="flex items-center gap-1"><MapPin size={15} /> {professional.city}, {professional.state}</span><span className="flex items-center gap-1 font-semibold text-[var(--rv-ink)]"><Star size={15} className="fill-[var(--rv-gold)] text-[var(--rv-gold)]" /> {professional.ratingAvg} · {professional.reviewsCount} reviews</span></p></div>
              <div className="hidden h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--rv-slate)] text-sm font-bold text-white sm:grid">{initials(displayName)}</div>
            </div>

            <div className="border-b border-[var(--rv-border)] py-8"><h2 className="font-display text-2xl">About</h2><p className="mt-4 max-w-3xl leading-7 text-[var(--rv-ink-2)]">{professional.bio}</p><div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">{[[`${professional.yearsExperience ?? 0}+`, "Years experience"], [`${professional.reviewsCount ?? 0}`, "Client reviews"], [professional.availabilityStatus ?? "Available", "Current availability"]].map(([value, label]) => <div key={label}><p className="text-lg font-bold">{value}</p><p className="mt-1 text-xs text-[var(--rv-ink-2)]">{label}</p></div>)}</div></div>

            <div className="border-b border-[var(--rv-border)] py-8"><h2 className="font-display text-2xl">Services and expertise</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{(professional.services ?? []).map((service) => <div key={service} className="flex items-center gap-3 rounded-md bg-[var(--rv-bg)] p-4 text-sm font-semibold"><span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[var(--rv-moss)]"><Check size={15} /></span>{service}</div>)}</div><p className="mt-5 text-sm text-[var(--rv-ink-2)]">Service areas: {(professional.serviceAreas ?? []).join(" · ")}</p></div>

            <div className="border-b border-[var(--rv-border)] py-8"><div className="flex items-center justify-between"><h2 className="font-display text-2xl">Featured projects</h2><span className="text-sm font-semibold">{portfolio.length} projects</span></div><div className="mt-5 grid gap-5 sm:grid-cols-2">{portfolio.map((item, index) => <article key={item.id} className="overflow-hidden rounded-lg border border-[var(--rv-border)]"><div className="aspect-[16/10] overflow-hidden"><img src={gallery[(index + 1) % gallery.length]} alt={item.title} className="h-full w-full object-cover" /></div><div className="p-4"><p className="text-xs font-bold text-[var(--rv-terracotta)]">{item.category} · {item.location}</p><h3 className="mt-1 text-lg font-bold">{item.title}</h3><p className="mt-2 text-sm leading-5 text-[var(--rv-ink-2)]">{item.description}</p></div></article>)}</div></div>

            <div className="py-8"><div className="flex items-center gap-3"><Star size={27} className="fill-[var(--rv-gold)] text-[var(--rv-gold)]" /><h2 className="font-display text-2xl">{professional.ratingAvg} · {professional.reviewsCount} reviews</h2></div><div className="mt-5 grid gap-4">{reviews.map((review) => <article key={review.id} className="rounded-lg border border-[var(--rv-border)] p-5"><div className="flex gap-1 text-[var(--rv-gold)]">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} size={14} fill="currentColor" />)}</div><p className="mt-3 text-sm leading-6">{review.reviewText}</p><p className="mt-3 text-xs font-semibold text-[var(--rv-ink-2)]">Verified Sajivo project</p></article>)}</div></div>
          </div>

          <aside className="relative"><div className="sticky top-28 rounded-lg border border-[var(--rv-border)] bg-white p-6 shadow-xl shadow-black/5"><p className="text-xs text-[var(--rv-ink-2)]">Projects starting from</p><p className="mt-1 text-2xl font-bold">{formatCurrency(professional.startingPrice)}</p><div className="mt-5 rounded-md bg-[var(--rv-bg)] p-4"><p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={17} className="text-[var(--rv-moss)]" /> Verified professional</p><p className="mt-2 text-xs leading-5 text-[var(--rv-ink-2)]">Credentials and business details reviewed by Sajivo.</p></div><ButtonLink href="/v2/register?role=customer" className="mt-5 w-full">Start a project</ButtonLink><ButtonLink href="/login" variant="outline" className="mt-2 w-full"><MessageSquare size={17} /> Send a message</ButtonLink><p className="mt-4 text-center text-xs text-[var(--rv-ink-2)]">No payment required to start a conversation.</p></div></aside>
        </div>
      </section>
    </>
  );
}
