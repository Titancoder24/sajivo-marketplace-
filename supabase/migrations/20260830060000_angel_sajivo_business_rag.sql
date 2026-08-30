create index if not exists ai_knowledge_articles_fts_idx
on public.ai_knowledge_articles using gin (
  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(body, ''))
)
where status = 'published';

create or replace function public.match_ai_knowledge_articles(
  query_text text,
  requested_locale text default 'en',
  match_count integer default 6
)
returns table (
  slug text,
  title text,
  category text,
  locale text,
  summary text,
  body text,
  keywords text[],
  relevance real
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with search as (
    select plainto_tsquery('simple', coalesce(query_text, '')) as query
  )
  select
    article.slug,
    article.title,
    article.category,
    article.locale,
    article.summary,
    article.body,
    article.keywords,
    ts_rank_cd(
      to_tsvector('simple', article.title || ' ' || article.summary || ' ' || article.body),
      search.query
    )::real as relevance
  from public.ai_knowledge_articles article
  cross join search
  where article.status = 'published'
    and article.locale = case when requested_locale = 'hi' then 'hi' else 'en' end
    and (
      numnode(search.query) = 0
      or to_tsvector('simple', article.title || ' ' || article.summary || ' ' || article.body) @@ search.query
      or article.keywords && regexp_split_to_array(lower(coalesce(query_text, '')), '[^[:alnum:]]+')
    )
  order by relevance desc, article.updated_at desc
  limit greatest(1, least(coalesce(match_count, 6), 10));
$$;

revoke all on function public.match_ai_knowledge_articles(text, text, integer) from public, anon;
grant execute on function public.match_ai_knowledge_articles(text, text, integer) to authenticated;

insert into public.ai_knowledge_articles (slug, title, category, locale, summary, body, keywords, status, published_at)
values
  (
    'sajivo-platform-overview-v1',
    'What Sajivo is: marketplace, business OS and AI operating system',
    'support', 'en',
    'Sajivo is one connected ecosystem for discovering, planning, contracting, executing, paying for and reviewing interior, architecture and construction work.',
    'Sajivo combines a services marketplace, a business operating system, a project management platform, a financial platform, a trust network, a catalog and commerce layer, and the SAIOS intelligence layer. Customers use Sajivo to create structured requirements, discover suitable professionals and suppliers, compare proposals, formalize contracts, manage execution, make milestone-linked payments, receive handover documents and publish reviews. Designers, architects, contractors, vendors, suppliers and their teams use Sajivo to discover opportunities, submit quotations, manage clients, projects, tasks, documents, communication, invoices, receipts, subscriptions, credits, reputation and growth. The Sajivo team operates trust, support, compliance, analytics and marketplace controls. The intended outcome is a successful project and happy customer while helping capable businesses find work, execute reliably, receive payment and build reputation.',
    array['sajivo','business','marketplace','business os','saios','platform','what is sajivo','company'],
    'published', now()
  ),
  (
    'sajivo-users-identity-and-roles-v1',
    'Users, identity, accounts and role permissions',
    'account', 'en',
    'Sajivo supports customers, professional businesses, vendors, teams and platform administrators through one identity and permission model.',
    'Every participant has a person identity and an account identity. Customers can be homeowners or businesses. Professional businesses include interior designers, architects and execution contractors. Vendor businesses supply products and materials. Organizations can contain owners, managers, project managers, engineers, supervisors, workers, specialists and accountants. Profiles hold the active role, organization relationship, verification status and reputation. Permissions control which records and actions each member can access. Only authorized representatives can submit proposals or bind an organization. Verification, trust signals and audit history are attached to the identity rather than treated as decorative profile fields.',
    array['users','roles','identity','account','customer','designer','architect','contractor','vendor','worker','admin','permissions'],
    'published', now()
  ),
  (
    'sajivo-requirements-matching-opportunities-v1',
    'Requirement creation, AI matching and opportunity allocation',
    'projects', 'en',
    'Customer needs become structured requirements, then controlled opportunities for compatible professionals.',
    'A customer describes the project scope, spaces, style, location, budget, timeline, services and reference files. The requirement builder converts those inputs into a structured brief. SAIOS can analyze completeness and clarify missing information. The matching engine considers project type, expertise, service location, budget fit, availability, capacity, verification, ratings, performance, subscription entitlements, past response behavior and opportunity limits. It produces compatibility scores and allocates opportunities in controlled waves instead of broadcasting every lead to everyone. Eligible professionals review the opportunity and decide whether to submit a proposal or quotation.',
    array['requirement','brief','matching','compatibility','opportunity','allocation','lead','budget','location'],
    'published', now()
  ),
  (
    'sajivo-proposals-contracts-project-execution-v1',
    'Proposals, contracts and project execution',
    'projects', 'en',
    'Selection converts a marketplace opportunity into a governed project workspace.',
    'Professionals can submit a proposal with scope, pricing, timeline, terms and portfolio evidence. Customers compare proposals and select a preferred professional. Sajivo then supports a digital contract and electronic agreement workflow. The resulting project workspace is the operational source of truth for milestones, tasks, team assignments, progress updates, site photos, files, messages, approvals, risks and project health. Milestones connect delivery progress to invoices and payments. The workspace retains a traceable record from the accepted proposal through execution, revisions, completion and handover.',
    array['proposal','quotation','contract','project','workspace','milestone','task','execution','progress','site photo'],
    'published', now()
  ),
  (
    'sajivo-catalog-estimation-and-budget-v1',
    'Catalog, design taxonomy, range limiter and budget estimation',
    'projects', 'en',
    'A shared taxonomy makes requirements, specifications, estimates and product discovery consistent.',
    'Sajivo organizes spaces, elements, materials, finishes, brands, products and specifications in a structured catalog and design taxonomy. The project range limiter turns project type, property type, area, rooms, service choices, location and timeline into a realistic planning range. The budget estimator uses governed rate data and produces an estimate with materials, labour, professional or design fees, execution and contingency components. Estimates are planning guidance rather than a binding quotation. A professional proposal and verified site information are required before final commercial commitment. Future visualization capabilities can use the same taxonomy for recommendations and 3D experiences.',
    array['catalog','taxonomy','material','finish','product','specification','estimate','budget','range limiter','rate'],
    'published', now()
  ),
  (
    'sajivo-financial-documents-and-tax-v1',
    'Payments, invoices, receipts, documents and tax records',
    'payments', 'en',
    'The financial engine connects project milestones with invoices, payments, receipts and compliance records.',
    'A typical financial sequence is milestone completion, customer approval, invoice generation, payment, receipt generation and ledger recording. Sajivo supports invoices, receipts, payment records, refunds and adjustments, subscriptions, credits and wallet entries. Escrow and broader settlement capabilities can be introduced as governed future modules. Financial documents can include GST, TDS or TCS information where applicable. Contracts, invoices, receipts, certificates and templates belong to the document and asset engine and stay linked to users, organizations, requirements, projects, transactions and compliance records. Angel may explain recorded status but cannot execute payments, approve refunds, change bank details or invent a financial result.',
    array['payment','invoice','receipt','milestone','gst','tds','tcs','refund','escrow','document','ledger'],
    'published', now()
  ),
  (
    'sajivo-subscriptions-credits-entitlements-v1',
    'Subscriptions, credits, plans and entitlements',
    'subscriptions', 'en',
    'Plans and credits control paid platform access and measurable usage by role.',
    'Subscription plans define entitlements, feature access, role-specific limits, billing periods and renewal behavior for customers, professionals, vendors, businesses and teams. Usage tracking records consumption against those entitlements. The credit wallet separates plan-included credits from purchased top-ups and records every movement in a ledger. AI credits can control SAIOS usage. Angel can explain the current plan, renewal date, limits and recorded credit balance, but it cannot grant credits, alter a ledger, create a charge or change a subscription without the authorized account owner confirming the action.',
    array['subscription','plan','credit','wallet','entitlement','usage','renewal','billing','ai credits'],
    'published', now()
  ),
  (
    'sajivo-saios-ai-operating-system-v1',
    'SAIOS: Sajivo AI operating system and Angel',
    'support', 'en',
    'SAIOS is the intelligence layer across Sajivo, while Angel is its customer support assistant.',
    'SAIOS is not a disconnected chatbot product. It works across requirement structuring, professional matching, estimation, recommendations, document generation, risk alerts, support and analytics. Potential assistants include customer, designer, contractor, vendor, project, estimation, procurement, finance, compliance and support assistants. Angel is the support-facing assistant. Angel retrieves only published Sajivo knowledge plus the authenticated user context it is allowed to read. It can explain Sajivo, guide users to the correct workflow, interpret recorded account and project status, create a support ticket and arrange a callback. It must not invent policy or data and must hand sensitive or unresolved cases to a human specialist.',
    array['saios','ai','angel','assistant','rag','recommendation','estimation','support','automation'],
    'published', now()
  ),
  (
    'sajivo-trust-safety-compliance-v1',
    'Trust, safety, compliance and audit controls',
    'security', 'en',
    'Trust and safety operate throughout onboarding, matching, contracting, execution and payments.',
    'Sajivo combines identity and business verification, role permissions, reputation, risk scoring, fraud detection, dispute handling, encryption, row-level security and audit logs. Cross-cutting monitoring applies throughout the lifecycle instead of being limited to registration. Important actions retain a traceable history, including contracts, financial records, access events, verification outcomes and support actions. Users must never share passwords, OTPs, recovery codes, full payment credentials or private keys. High-risk changes require authenticated human review and must not be executed autonomously by Angel.',
    array['trust','safety','verification','risk','fraud','compliance','rls','encryption','audit','dispute'],
    'published', now()
  ),
  (
    'sajivo-communication-search-reputation-v1',
    'Communication, discovery, reviews and reputation',
    'communication', 'en',
    'Project-linked communication and reputation data strengthen collaboration and matching.',
    'Secure chat, files, notifications and announcements remain linked to the relevant requirement, opportunity, project, contract or transaction. The notification engine can support in-app, email, SMS, WhatsApp and push channels. Global search and discovery can cover professionals, projects, products, materials, requirements, vendors and documents using filters, smart suggestions and AI assistance. Reviews, ratings, rankings and performance history form the reputation engine. Reputation becomes an input to matching and opportunity allocation, while analytics measures marketplace quality and user outcomes.',
    array['communication','chat','file','notification','search','discovery','review','rating','reputation','ranking'],
    'published', now()
  ),
  (
    'sajivo-team-organization-control-v1',
    'Business organizations, teams and authorized representatives',
    'account', 'en',
    'Sajivo supports organizations with controlled member roles, capacity and workload.',
    'A contractor, designer or vendor business can operate as an organization rather than a single person. The organization can contain an owner, manager, project manager, engineer, supervisor, worker, specialist and accountant. Role-based permissions determine who can view opportunities, submit proposals, manage teams, update tasks, approve documents or access financial information. Only an authorized representative can submit a proposal or agreement on behalf of the organization. Capacity and workload data can help opportunity allocation avoid sending work to businesses that cannot currently deliver it.',
    array['organization','team','member','owner','manager','engineer','supervisor','worker','accountant','authorized representative'],
    'published', now()
  ),
  (
    'sajivo-platform-foundation-integrations-v1',
    'Platform foundation, integrations and resilience',
    'security', 'en',
    'Sajivo uses Supabase and PostgreSQL as its data and authentication foundation with governed external integrations.',
    'The platform foundation includes PostgreSQL, Supabase database, Supabase Storage or cloud storage, OTP and password authentication, sessions, MFA-ready controls, APIs, encryption, logs and row-level security. External providers can supply payment gateways for UPI, cards and net banking; e-signature; GST and tax services; WhatsApp, SMS and email; AI models through OpenRouter or another approved provider; maps and geolocation; and analytics such as GA4 or Microsoft Clarity. Backups, recovery, business continuity and failure protection remain operational responsibilities. Secrets must be stored in protected server environments or encrypted integration records, never in browser code or public repositories.',
    array['supabase','postgresql','storage','authentication','api','integration','payment gateway','openrouter','maps','analytics','backup'],
    'published', now()
  ),
  (
    'sajivo-nine-stage-lifecycle-v1',
    'Complete Sajivo nine-stage lifecycle',
    'projects', 'en',
    'The full journey runs from discovery and onboarding through review, reputation and repeat growth.',
    'Stage 1, Discovery and Onboarding: register, verify identity, select a customer, professional or vendor role, and complete the profile. Stage 2, Requirement Creation: add scope, style, budget, timeline, location and files, then publish the structured brief. Stage 3, AI Matching and Opportunity: analyze the requirement, score compatible professionals, allocate in waves and notify eligible businesses. Stage 4, Proposal and Quotation: professionals submit scope, pricing, timeline, terms and portfolio; the customer compares responses. Stage 5, Selection and Contract: select the preferred professional, generate the contract and complete electronic agreement. Stage 6, Project Execution: manage milestones, tasks, team collaboration, site updates and health signals. Stage 7, Payments and Milestones: approve delivery, generate an invoice, record payment, create a receipt and retain tax records. Stage 8, Completion and Handover: final delivery, handover documents, completion certificate and warranty activation. Stage 9, Review and Growth: reviews, ratings, reputation, rewards, referrals and analytics feed future matching and recommendations.',
    array['lifecycle','workflow','onboarding','requirement','matching','proposal','contract','execution','payment','handover','review'],
    'published', now()
  ),
  (
    'sajivo-analytics-growth-and-learning-v1',
    'Analytics, marketplace performance and continuous learning',
    'support', 'en',
    'Sajivo uses lifecycle data to improve marketplace performance, user outcomes and business growth.',
    'Analytics can measure requirement-to-match, match-to-proposal, proposal-to-contract, contract-to-project and project-to-completion conversion. Operational dashboards can track revenue, project health, response behavior, contractor performance, customer activity, subscriptions, retention, repeat projects, referrals and marketplace liquidity. Search and project data reveal popular categories, styles, materials, locations and budget trends. Completed project results, reviews and support outcomes feed better matching, recommendations, risk controls and product decisions. Analytics must respect permissions and privacy and should use governed event definitions rather than fabricated metrics.',
    array['analytics','dashboard','conversion','retention','revenue','performance','growth','insights','learning'],
    'published', now()
  ),
  (
    'sajivo-platform-overview-hi-v1',
    'साजिवो क्या है: मार्केटप्लेस, बिज़नेस OS और AI सिस्टम',
    'support', 'hi',
    'साजिवो इंटीरियर, आर्किटेक्चर और निर्माण प्रोजेक्ट की खोज, योजना, अनुबंध, काम, भुगतान और समीक्षा के लिए एक जुड़ा हुआ प्लेटफ़ॉर्म है।',
    'साजिवो एक ही इकोसिस्टम में सर्विस मार्केटप्लेस, बिज़नेस ऑपरेटिंग सिस्टम, प्रोजेक्ट मैनेजमेंट, वित्तीय रिकॉर्ड, भरोसा और सुरक्षा, कैटलॉग तथा SAIOS AI लेयर को जोड़ता है। ग्राहक आवश्यकता बनाते हैं, सही प्रोफेशनल खोजते हैं, प्रस्तावों की तुलना करते हैं, अनुबंध करते हैं, प्रोजेक्ट की प्रगति देखते हैं, माइलस्टोन के अनुसार भुगतान करते हैं और अंत में हैंडओवर तथा समीक्षा पूरी करते हैं। डिजाइनर, आर्किटेक्ट, कॉन्ट्रैक्टर, वेंडर और उनकी टीमें अवसर, कोटेशन, प्रोजेक्ट, दस्तावेज़, भुगतान, सदस्यता, क्रेडिट और प्रतिष्ठा संभालती हैं। लक्ष्य सफल प्रोजेक्ट, खुश ग्राहक और भरोसेमंद व्यवसायों की वृद्धि है।',
    array['साजिवो','व्यवसाय','मार्केटप्लेस','प्रोजेक्ट','sajivo','business'],
    'published', now()
  ),
  (
    'sajivo-nine-stage-lifecycle-hi-v1',
    'साजिवो की पूरी नौ-चरणीय कार्यप्रणाली',
    'projects', 'hi',
    'यात्रा रजिस्ट्रेशन से शुरू होकर आवश्यकता, मैचिंग, प्रस्ताव, अनुबंध, काम, भुगतान, हैंडओवर और समीक्षा तक जाती है।',
    'चरण 1: रजिस्ट्रेशन, पहचान सत्यापन, भूमिका और प्रोफ़ाइल। चरण 2: स्कोप, शैली, बजट, समय, स्थान और फाइल के साथ आवश्यकता बनाना। चरण 3: AI विश्लेषण, संगतता स्कोर और योग्य प्रोफेशनल को अवसर देना। चरण 4: प्रस्ताव और कोटेशन की तुलना। चरण 5: प्रोफेशनल चयन और डिजिटल अनुबंध। चरण 6: माइलस्टोन, टास्क, टीम, साइट अपडेट और प्रगति के साथ प्रोजेक्ट निष्पादन। चरण 7: मंजूरी, इनवॉइस, भुगतान, रसीद और कर रिकॉर्ड। चरण 8: अंतिम डिलीवरी, हैंडओवर दस्तावेज़, पूर्णता प्रमाणपत्र और वारंटी। चरण 9: समीक्षा, रेटिंग, प्रतिष्ठा, रेफरल और एनालिटिक्स से लगातार सुधार।',
    array['कार्यप्रणाली','चरण','रजिस्ट्रेशन','मैचिंग','प्रस्ताव','अनुबंध','भुगतान','हैंडओवर','workflow'],
    'published', now()
  ),
  (
    'sajivo-saios-angel-hi-v1',
    'SAIOS और Angel AI की भूमिका',
    'support', 'hi',
    'SAIOS पूरे साजिवो में काम करने वाली AI लेयर है और Angel ग्राहक सहायता सहायक है।',
    'SAIOS आवश्यकता को संरचित करने, सही प्रोफेशनल सुझाने, बजट अनुमान, दस्तावेज़, जोखिम चेतावनी, सहायता और एनालिटिक्स में मदद करता है। Angel केवल प्रकाशित साजिवो ज्ञान और लॉग-इन उपयोगकर्ता के अधिकृत संदर्भ का उपयोग करता है। वह प्लेटफ़ॉर्म समझा सकता है, सही स्क्रीन या प्रक्रिया बता सकता है, दर्ज प्रोजेक्ट या खाते की स्थिति समझा सकता है, सपोर्ट टिकट बना सकता है और कॉल निर्धारित कर सकता है। वह नीति, भुगतान या स्थिति गढ़ नहीं सकता और संवेदनशील मामलों को मानव विशेषज्ञ तक भेजता है।',
    array['saios','angel','एआई','सहायता','rag','ai'],
    'published', now()
  )
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  locale = excluded.locale,
  summary = excluded.summary,
  body = excluded.body,
  keywords = excluded.keywords,
  status = excluded.status,
  published_at = coalesce(public.ai_knowledge_articles.published_at, excluded.published_at),
  version = public.ai_knowledge_articles.version + 1,
  updated_at = now();

comment on function public.match_ai_knowledge_articles(text, text, integer)
is 'Ranks published, locale-specific Sajivo knowledge for Angel RAG retrieval.';
