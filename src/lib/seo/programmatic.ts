export type SeoIntent = "commercial" | "local" | "informational" | "transactional";

export type SeoSection = {
  heading: string;
  body: string;
  points: string[];
};

export type SeoFaq = {
  question: string;
  answer: string;
};

type SeoTemplate = {
  slug: string;
  aliases: string[];
  serviceName: string;
  intent: SeoIntent;
  title: string;
  description: string;
  h1: string;
  introduction: string;
  localInsights: string;
  keywords: string[];
  sections: SeoSection[];
  faq: SeoFaq[];
};

export type ProgrammaticSeoContent = Omit<SeoTemplate, "aliases">;

const templates: SeoTemplate[] = [
  {
    slug: "interior-designers",
    aliases: ["interior-designer", "interior-designer-for-3bhk", "best-interior-designer-near-me"],
    serviceName: "Interior Designers",
    intent: "local",
    title: "Interior Designers in {city} for 3BHK & Home Projects | Sajivo",
    description: "Compare interior designers in {city} for 3BHK and home projects. Review scope, design fees, portfolios, timelines and itemised proposals on Sajivo.",
    h1: "Interior designers in {city} for homes and 3BHK projects",
    introduction: "Finding the best interior designer near you is less about a label and more about fit. Define the rooms, finish level, budget range and handover date, then compare designers in {city} on relevant work, responsibilities and a written proposal.",
    localInsights: "For a {city}, {state} project, ask whether site measurement, drawings, material selection, contractor coordination and snag closure are included. A 3BHK scope should separate fixed furniture, loose furniture, lighting, civil work and appliances so comparisons stay meaningful.",
    keywords: ["best interior designer near me", "interior designer for 3BHK", "interior designers in {city}", "3BHK interior designer {city}"],
    sections: [
      { heading: "Build a comparable 3BHK brief", body: "Room-by-room requirements prevent an attractive headline quote from hiding missing work. Record what stays, what changes and who supplies each item.", points: ["List storage, lighting and electrical needs by room", "Mark owner-supplied appliances and furniture", "Set a practical design-freeze and move-in date"] },
      { heading: "Check design and delivery fit", body: "Review completed projects close to your property type and budget. Confirm who visits the site, coordinates trades and approves substitutions after work starts.", points: ["Ask for recent, relevant project references", "Review drawings and material specifications", "Clarify design-only, supervision and turnkey fees"] },
      { heading: "Compare the whole proposal", body: "The lowest design fee may not produce the lowest final project cost. Compare exclusions, quantities, brands, taxes, payment stages and change-order rules together.", points: ["Normalise scope before comparing totals", "Tie payments to clear deliverables", "Keep approvals and revisions in writing"] },
    ],
    faq: [
      { question: "How do I choose an interior designer for a 3BHK in {city}?", answer: "Shortlist designers with relevant apartment work, then compare the same room-by-room brief, drawings, material specifications, supervision responsibility, exclusions and payment stages." },
      { question: "Does Sajivo name one best interior designer near me?", answer: "No. 'Best' depends on scope, budget, style, availability and delivery model. Sajivo helps you organise requirements and compare available marketplace information and proposals." },
      { question: "What should an interior design proposal include?", answer: "Look for room-wise scope, drawings, quantities, material or brand specifications, fees, taxes, exclusions, timeline, payment stages, warranty terms and a process for changes." },
    ],
  },
  {
    slug: "home-renovation",
    aliases: ["home-renovation-contractor", "reliable-contractor-for-home-renovation", "turnkey-interior-contractor", "best-contractor-near-me"],
    serviceName: "Home Renovation Contractors",
    intent: "local",
    title: "Home Renovation Contractors in {city} | Compare Scope & Quotes",
    description: "Find home renovation and turnkey interior contractors in {city}. Compare credentials, itemised quotations, timelines, responsibilities and payment terms.",
    h1: "Home renovation contractors in {city}",
    introduction: "A reliable contractor for home renovation should make scope, cost, responsibility and progress visible before work begins. Use one written brief to compare contractors in {city}, including turnkey options, without treating a low headline price as the only decision point.",
    localInsights: "Renovation in {city}, {state} may involve society rules, access hours, debris removal, service-lift bookings and occupied-home protection. Put these site constraints in the enquiry so each contractor prices the same conditions.",
    keywords: ["best contractor near me", "reliable contractor for home renovation", "home renovation contractor", "turnkey interior contractor", "home renovation contractor {city}"],
    sections: [
      { heading: "Define contractor responsibility", body: "Turnkey can mean different things. State whether design, permissions, procurement, labour, site supervision, cleaning and handover are included.", points: ["Separate demolition, civil, MEP and finishes", "Name owner-supplied and contractor-supplied items", "Document protection and debris responsibilities"] },
      { heading: "Check reliability before award", body: "Credibility is established through verifiable evidence and clear commercial terms, not a single badge or review. Validate the business and the people who will run your site.", points: ["Review comparable recent work and references", "Confirm registration, address and payment identity", "Meet the assigned supervisor before signing"] },
      { heading: "Control changes and payments", body: "Renovations uncover surprises, but that should not make costs untraceable. Require written change orders with quantity, rate and schedule impact before extra work proceeds.", points: ["Link payment stages to measurable progress", "Keep a contingency outside the base contract", "Record defects and closure evidence at handover"] },
    ],
    faq: [
      { question: "How can I find a reliable home renovation contractor in {city}?", answer: "Use a consistent scope, check recent comparable projects and references, verify business and payment details, meet the site supervisor, and compare written terms before paying an advance." },
      { question: "What does a turnkey interior contractor include?", answer: "It can include design, procurement, labour, supervision and handover, but inclusions vary. The contract should explicitly name drawings, materials, services, permissions, taxes, exclusions and warranty responsibilities." },
      { question: "Should I choose the lowest renovation quotation?", answer: "Not automatically. First align quantities, specifications, exclusions, taxes, payment stages and timeline. A lower total can simply reflect omitted or provisional work." },
    ],
  },
  {
    slug: "office-interior-contractors",
    aliases: ["office-interior-contractor", "commercial-interior-contractor", "commercial-interiors"],
    serviceName: "Office & Commercial Interior Contractors",
    intent: "commercial",
    title: "Office & Commercial Interior Contractors in {city} | Sajivo",
    description: "Compare office and commercial interior contractors in {city} for fit-outs, services coordination, procurement, schedules, compliance and handover.",
    h1: "Office and commercial interior contractors in {city}",
    introduction: "Commercial fit-outs need more than finish selection. Compare contractors in {city} against the same workplace brief, services scope, operating constraints, programme, documentation and handover standard.",
    localInsights: "For commercial work in {city}, {state}, capture landlord or facility rules, work permits, loading access, fire and MEP coordination, working hours and business-continuity constraints before requesting prices.",
    keywords: ["office interior contractor", "commercial interior contractor", "office interior contractor {city}", "commercial fit out contractor {city}"],
    sections: [
      { heading: "Start with an operational brief", body: "Headcount, work modes, client areas, IT, acoustics, storage and future growth shape the scope. Record operational priorities before layouts are priced.", points: ["Define occupancy, teams and support spaces", "Include AV, data, access control and signage", "Identify after-hours and phased-working needs"] },
      { heading: "Coordinate compliance and services", body: "Commercial delivery depends on coordinated drawings and approvals. Assign responsibility for fire, HVAC, electrical, plumbing and landlord submissions.", points: ["Request a drawing and submittal schedule", "Name approval owners and dependencies", "Track testing, certificates and as-built records"] },
      { heading: "Protect programme and handover", body: "Compare lead times and sequencing, not only a completion date. Long-lead materials, authority reviews and live-site restrictions should appear in the programme.", points: ["Use milestone-based progress reporting", "Log decisions and approved substitutions", "Define snag, training and closeout deliverables"] },
    ],
    faq: [
      { question: "What should I ask an office interior contractor in {city}?", answer: "Ask for relevant commercial references, a coordinated scope, programme, team structure, services responsibilities, safety process, exclusions and a complete handover-document list." },
      { question: "How is a commercial interior contractor different from a residential contractor?", answer: "Commercial work usually has stronger coordination, compliance, safety, access, documentation and business-continuity requirements. Relevant delivery experience matters." },
      { question: "Can office fit-out quotations be compared directly?", answer: "Only after aligning drawings, quantities, specifications, services scope, preliminaries, taxes, exclusions, programme and handover obligations." },
    ],
  },
  {
    slug: "renovation-cost",
    aliases: ["home-renovation-cost", "house-renovation-cost"],
    serviceName: "Home Renovation Cost Guide",
    intent: "informational",
    title: "Home & House Renovation Cost in {city}: Planning Guide",
    description: "Plan a home renovation budget in {city}. Understand the scope, quantity, finish, services, contingency and quotation details that affect final cost.",
    h1: "Home renovation cost planning in {city}",
    introduction: "Home renovation cost cannot be reduced to one dependable city-wide figure. Property condition, quantities, specifications, access and occupied-site constraints matter. Build a room-wise scope first, then use current itemised quotations for your {city} project.",
    localInsights: "House renovation cost in {city}, {state} should account for local labour and supplier quotations, building access, disposal rules, delivery restrictions and the condition found after opening up old work. Figures on this page are planning guidance, not a quote.",
    keywords: ["home renovation cost", "house renovation cost", "home renovation cost {city}", "house renovation estimate {city}"],
    sections: [
      { heading: "What changes renovation cost", body: "Area is only one input. Existing condition, demolition, service upgrades, finish grade, custom work and project duration can change the result materially.", points: ["Measure quantities instead of relying on area alone", "Separate repair, replacement and new additions", "Flag concealed-condition assumptions"] },
      { heading: "Build a useful budget", body: "Group the budget into work packages so omissions are visible and later decisions can be evaluated without losing the baseline.", points: ["Include professional fees, taxes and approvals", "Add temporary works, protection and disposal", "Hold a separately approved contingency"] },
      { heading: "Move from estimate to quotation", body: "A planning range becomes actionable only after site review and specification. Issue the same documents to shortlisted contractors and reconcile differences line by line.", points: ["Use room-wise quantities and specifications", "Identify provisional sums and exclusions", "Record quote validity and escalation assumptions"] },
    ],
    faq: [
      { question: "How is home renovation cost calculated in {city}?", answer: "A useful estimate combines measured quantities, existing condition, labour, material specifications, services work, access, professional fees, taxes and contingency. A site-specific quotation is still required." },
      { question: "Is cost per square foot enough for a house renovation?", answer: "Usually not. Kitchens, bathrooms, services and repairs are not evenly distributed by area. Use per-square-foot figures only as an early check, then price measured work packages." },
      { question: "How much contingency should I keep?", answer: "It depends on design maturity and existing condition. Agree a risk-based allowance with your adviser and keep its use documented rather than embedding an invisible buffer in every line item." },
    ],
  },
  {
    slug: "interior-design-cost",
    aliases: ["interior-design-cost-per-sq-ft", "interior-cost-per-sq-ft"],
    serviceName: "Interior Design Cost per Sq Ft Guide",
    intent: "informational",
    title: "Interior Design Cost per Sq Ft in {city}: What to Compare",
    description: "Understand interior design cost per sq ft in {city}, what area and scope the rate covers, and how to compare specifications, fees and exclusions.",
    h1: "Interior design cost per sq ft in {city}",
    introduction: "A per-square-foot rate is useful only when the measured area and included scope are identical. Use it as an early benchmark, then compare room-wise quantities, specifications, design fees and exclusions for your {city} project.",
    localInsights: "Rates quoted in {city}, {state} may refer to carpet, built-up or furniture area and may bundle very different work. Ask every bidder to state the area basis, tax treatment, brands, hardware category and excluded civil or services work.",
    keywords: ["interior design cost per sq ft", "interior design cost per sq ft {city}", "interior cost estimate {city}"],
    sections: [
      { heading: "Define the denominator", body: "Two identical rates can produce different totals when one uses carpet area and another uses built-up area. Record the exact measured area behind every rate.", points: ["State carpet, built-up or chargeable area", "Separate furniture quantity from floor area", "Confirm whether balconies and utility areas count"] },
      { heading: "Define what the rate includes", body: "Design, modular work, loose furniture, civil changes, lighting and appliances are often treated differently. A written inclusion schedule is essential.", points: ["Separate design fees and execution cost", "Specify board, finish, hardware and warranty", "List taxes, transport and installation"] },
      { heading: "Use room-wise checks", body: "A room-wise estimate exposes unusually high or low allowances and makes value engineering more controlled than applying one blended rate.", points: ["Review kitchens and wardrobes separately", "Track electrical, ceiling and painting packages", "Compare like-for-like before negotiating"] },
    ],
    faq: [
      { question: "What does interior design cost per sq ft include?", answer: "There is no universal definition. Ask whether it includes design, drawings, modular furniture, finishes, civil and electrical work, lighting, taxes, installation, supervision and warranty." },
      { question: "Which area should be used for the calculation?", answer: "The proposal should explicitly name the area basis. Carpet, built-up and furniture-area methods are not interchangeable." },
      { question: "Can I use a per-square-foot rate as my final budget?", answer: "Treat it as an early benchmark. Final budgeting should use site measurements, room-wise scope, specifications and current supplier or contractor quotations." },
    ],
  },
  {
    slug: "civil-contractors",
    aliases: ["construction-cost", "construction-cost-estimate", "building-cost-estimate"],
    serviceName: "Construction Cost Estimates & Civil Contractors",
    intent: "commercial",
    title: "Construction Cost Estimate & Civil Contractors in {city}",
    description: "Prepare a construction cost estimate and compare civil contractors in {city} using aligned drawings, quantities, specifications, preliminaries and terms.",
    h1: "Construction cost estimates and civil contractors in {city}",
    introduction: "A construction cost estimate is a decision tool, not a fixed promise. Improve accuracy by aligning drawings, measured quantities, structural and services scope, specifications and site conditions before comparing civil contractors in {city}.",
    localInsights: "In {city}, {state}, plot access, soil and foundation assumptions, approval conditions, water and power availability, material logistics and market quotations can affect cost and programme. Validate assumptions before contract award.",
    keywords: ["construction cost estimate", "civil contractors in {city}", "construction cost estimate {city}"],
    sections: [
      { heading: "Match estimate stage to design stage", body: "Early area-based estimates carry more uncertainty than estimates built from coordinated drawings and a bill of quantities. Label the basis and date of every revision.", points: ["Record drawing revision and assumptions", "Separate structure, finishes and services", "Show professional fees, taxes and approvals"] },
      { heading: "Compare contractor pricing", body: "Issue the same bill, specifications and commercial conditions to every bidder. Reconcile blank items, alternative brands and arithmetic before ranking totals.", points: ["Normalise quantities and unit rates", "Review preliminaries and temporary works", "Identify provisional and owner-supplied items"] },
      { heading: "Protect budget during construction", body: "Track committed cost, certified work, approved changes and forecast-at-completion separately. This shows pressure before it becomes an end-of-project surprise.", points: ["Approve changes before execution", "Measure progress against contract quantities", "Update risk and contingency logs"] },
    ],
    faq: [
      { question: "How accurate is a construction cost estimate?", answer: "Accuracy depends on design completeness, measurement quality, specifications, site information and current market quotes. Early estimates should state an uncertainty range and assumptions." },
      { question: "How do I compare civil contractors in {city}?", answer: "Compare the same drawings, quantities, specifications, schedule and contract terms, then assess relevant experience, team, references, exclusions, cash-flow request and change process." },
      { question: "Does an estimate guarantee final construction cost?", answer: "No. Design changes, concealed conditions, quantity changes and market movements can affect the result. A controlled change process and current forecast are essential." },
    ],
  },
  {
    slug: "modular-kitchen",
    aliases: ["modular-kitchen-cost", "modular-kitchen-designers"],
    serviceName: "Modular Kitchen Cost & Contractors",
    intent: "commercial",
    title: "Modular Kitchen Cost & Contractors in {city} | Sajivo",
    description: "Compare modular kitchen cost and contractors in {city} by layout, cabinet quantity, board, finish, hardware, accessories, services and installation.",
    h1: "Modular kitchen cost and contractors in {city}",
    introduction: "Modular kitchen cost depends on cabinet quantity and specification, not just a running-foot headline. Compare layouts and quotations in {city} using the same board, finish, hardware, accessories, countertop, services and installation scope.",
    localInsights: "For a kitchen in {city}, {state}, confirm site measurement, appliance models, plumbing and electrical points, delivery access and protection of occupied areas. Humidity, maintenance and service availability should inform material choices.",
    keywords: ["modular kitchen cost", "modular kitchen cost {city}", "modular kitchen contractor {city}"],
    sections: [
      { heading: "Price the designed cabinet quantity", body: "Wall, base, tall and corner units use different material and hardware. A drawing with dimensions is more useful than a single running-foot rate.", points: ["Count shutters, drawers and internal units", "Separate lofts, tall units and corner systems", "Confirm carcass and shutter specifications"] },
      { heading: "Align finish and hardware", body: "Finish category, edge treatment, hinges, channels and accessories can shift cost substantially. Ask for brand, series and warranty in writing.", points: ["Name board grade and thickness", "Specify finish on each visible surface", "List hardware and accessory models"] },
      { heading: "Include the surrounding work", body: "Countertops, sinks, appliances, plumbing, electrical work, tiling and civil changes may sit outside a modular quote. Put them in the comparison schedule.", points: ["Identify every excluded trade", "Confirm delivery and installation charges", "Define measurement and snag responsibility"] },
    ],
    faq: [
      { question: "What determines modular kitchen cost in {city}?", answer: "Layout, cabinet quantity, board and finish, hardware, accessories, countertop, appliances, services changes, delivery and installation all affect cost." },
      { question: "Is a running-foot rate enough to compare kitchens?", answer: "No. Definitions and cabinet mixes differ. Compare dimensioned drawings, unit schedules, material specifications, hardware models, exclusions, taxes and warranty." },
      { question: "What should be finalised before ordering?", answer: "Freeze site measurements, appliance models, plumbing and electrical points, cabinet drawings, finishes, hardware, countertop details and responsibility for adjacent work." },
    ],
  },
  {
    slug: "bathroom-renovation-cost",
    aliases: ["bathroom-remodel-cost", "bathroom-contractors"],
    serviceName: "Bathroom Renovation Cost Guide",
    intent: "informational",
    title: "Bathroom Renovation Cost in {city}: Scope & Quote Guide",
    description: "Plan bathroom renovation cost in {city}. Compare demolition, waterproofing, plumbing, tiling, fixtures, ventilation, testing and warranty scope.",
    h1: "Bathroom renovation cost planning in {city}",
    introduction: "Bathroom renovation cost is driven by more than tile area. Existing leaks, plumbing changes, waterproofing, fixture choices, access and testing all matter. Use a complete scope to request comparable quotations in {city}.",
    localInsights: "For bathrooms in {city}, {state}, document water shut-down rules, debris movement, neighbour protection and working hours. Confirm how concealed defects will be reported and priced before demolition starts.",
    keywords: ["bathroom renovation cost", "bathroom renovation cost {city}", "bathroom contractor {city}"],
    sections: [
      { heading: "Define the full work sequence", body: "A sound quote follows the delivery sequence from protection and demolition through services, waterproofing, finishes, fixtures and testing.", points: ["Include disposal and substrate repairs", "Specify waterproofing system and test", "List plumbing and electrical point changes"] },
      { heading: "Compare fixtures and finishes", body: "Tile size, laying pattern, sanitaryware, brassware, glass and storage affect both material and labour. Use named selections or clear allowances.", points: ["State tile quantities and wastage", "Identify fixture brands or budget allowances", "Separate supply and installation responsibilities"] },
      { heading: "Close with evidence", body: "Handover should include test records, product details, warranties and closure of leaks, drainage, slopes, sealants and finish defects.", points: ["Inspect before concealed work is covered", "Record water and drainage tests", "Retain a signed snag and warranty list"] },
    ],
    faq: [
      { question: "What is included in bathroom renovation cost?", answer: "A complete scope may include protection, demolition, disposal, plumbing, electrical work, waterproofing, screed, tiles, ceiling, fixtures, glass, painting, testing and cleaning." },
      { question: "Why do bathroom quotations vary so much?", answer: "Contractors may assume different repair needs, specifications, fixture allowances, waterproofing systems and exclusions. Align these before comparing totals." },
      { question: "How should waterproofing be documented?", answer: "Record the specified system, preparation, application stages, test method, result, installer responsibility and warranty before covering the work." },
    ],
  },
  {
    slug: "false-ceiling-cost",
    aliases: ["false-ceiling-contractors", "ceiling-cost"],
    serviceName: "False Ceiling Cost Guide",
    intent: "informational",
    title: "False Ceiling Cost in {city}: Materials, Scope & Quotes",
    description: "Plan false ceiling cost in {city} by ceiling area, levels, material system, lighting details, access panels, finishing and site conditions.",
    h1: "False ceiling cost planning in {city}",
    introduction: "False ceiling cost changes with actual ceiling area, levels, curves, drops, material system, lighting details and finishing. Compare dimensioned reflected-ceiling plans and specifications, not an isolated per-square-foot rate.",
    localInsights: "In {city}, {state}, include slab condition, ceiling height, service coordination, delivery access and protection of completed work. Confirm that framing, boards, jointing, cut-outs, access panels and final paint are all allocated.",
    keywords: ["false ceiling cost", "false ceiling cost {city}", "false ceiling contractor {city}"],
    sections: [
      { heading: "Measure the designed ceiling", body: "Simple flat areas and multi-level feature ceilings consume different material and labour. Price from a dimensioned plan with sections and edge details.", points: ["Measure each ceiling type separately", "Count drops, coves and access panels", "Coordinate light and service cut-outs"] },
      { heading: "Specify the complete system", body: "Board alone does not define performance. Framing gauge and spacing, suspension, moisture resistance, joints, perimeter details and paint system matter.", points: ["Name board type and thickness", "Specify framing and suspension standard", "Include joint treatment and final finish"] },
      { heading: "Coordinate before closing", body: "Electrical, HVAC, fire and plumbing work above the ceiling should be inspected before boards close access. Late changes create avoidable rework.", points: ["Freeze coordinated service locations", "Photograph concealed services", "Test access and lighting before handover"] },
    ],
    faq: [
      { question: "How is false ceiling cost calculated?", answer: "Use measured ceiling areas by type, plus drops, coves, curves, framing, boards, access panels, service cut-outs, jointing, paint, transport, taxes and site conditions." },
      { question: "Does a false ceiling quote include lighting?", answer: "Not necessarily. Ask whether fixtures, drivers, wiring, cut-outs, installation and testing are included or owner supplied." },
      { question: "What should I compare besides the rate?", answer: "Compare design quantity, board type, framing specification, suspension, edge and joint details, access panels, painting, exclusions, warranty and programme." },
    ],
  },
  {
    slug: "contractor-credibility",
    aliases: ["how-to-choose-a-contractor", "check-contractor-credibility", "renovation-fraud"],
    serviceName: "Contractor Credibility Guide",
    intent: "informational",
    title: "How to Check Contractor Credibility in {city} | Sajivo",
    description: "Learn how to choose a contractor in {city}: verify identity, references, scope, quotations, team, payment terms, change controls and handover evidence.",
    h1: "How to choose and check a contractor in {city}",
    introduction: "No single badge can establish contractor credibility. Reduce renovation fraud risk by checking independent evidence, comparing written scope and commercial terms, and keeping approvals, payments and progress traceable.",
    localInsights: "When evaluating a contractor in {city}, {state}, verify the business name, address and payment beneficiary; speak with recent clients; and visit a comparable live or completed site when permission is available.",
    keywords: ["how to choose contractor", "check credibility of contractor", "contractor credibility check"],
    sections: [
      { heading: "Verify identity and track record", body: "Cross-check who is contracting, who receives money and who supervises the work. References should be recent and relevant to your project type.", points: ["Match contract, invoice and bank-account names", "Call clients using independently confirmed details", "Review both finished quality and issue resolution"] },
      { heading: "Test the proposal", body: "A credible proposal explains quantities, specifications, exclusions, programme and payment logic. Large unexplained advances or pressure to skip documents deserve scrutiny.", points: ["Compare an itemised scope, not one total", "Ask how changes and delays are handled", "Avoid cash or payments to unrelated parties"] },
      { heading: "Keep delivery auditable", body: "Use dated records for decisions, progress, material approvals, invoices, changes and defects. Documentation supports clear decisions; it does not remove the need for judgement.", points: ["Tie payments to inspected milestones", "Keep photographic and written progress records", "Complete snagging and handover before final release"] },
    ],
    faq: [
      { question: "How do I check a contractor's credibility?", answer: "Verify legal and payment identity, address, relevant registrations where applicable, recent references, comparable work, assigned team, insurance or warranties, and the completeness of the written proposal." },
      { question: "What contractor warning signs should I watch for?", answer: "Warning signs include pressure for large or cash advances, mismatched names, vague scope, refusal to provide references, unrealistic schedules, missing exclusions and undocumented changes." },
      { question: "Does Sajivo guarantee a contractor's work?", answer: "No marketplace profile or comparison replaces your own due diligence and contract review. Evaluate the available information, proposal and project-specific risks before appointment." },
    ],
  },
  {
    slug: "quotation-comparison",
    aliases: ["compare-contractor-quotes", "contractor-quotation-comparison"],
    serviceName: "Contractor Quotation Comparison",
    intent: "informational",
    title: "Contractor Quotation Comparison in {city}: Like-for-Like Guide",
    description: "Compare contractor quotations in {city} by normalising scope, quantities, specifications, exclusions, taxes, timeline, payments, warranty and changes.",
    h1: "Contractor quotation comparison for {city} projects",
    introduction: "Quotation comparison is reliable only when bidders price the same information. Normalise scope, quantity, specification and commercial terms before treating the lowest total as better value.",
    localInsights: "For a {city}, {state} project, add access, working-hour, debris, delivery and approval constraints to the bid documents. Otherwise each contractor may carry a different assumption for the same site.",
    keywords: ["quotation comparison", "contractor quotation comparison", "compare contractor quotes", "quotation comparison {city}"],
    sections: [
      { heading: "Create one comparison baseline", body: "Use the same drawings, room list, quantity schedule, material brief and contract conditions for every bidder, then record clarifications against that baseline.", points: ["Align missing and zero-priced items", "Separate alternatives from compliant offers", "Check arithmetic, taxes and quote validity"] },
      { heading: "Normalise commercial terms", body: "Payment timing, retention, warranty and delay terms affect risk and cash flow. Compare them alongside price rather than in a separate final review.", points: ["Compare advance and milestone percentages", "Record lead-time and escalation assumptions", "Review change-order mark-ups and exclusions"] },
      { heading: "Document the award decision", body: "Keep the reconciled quotation, accepted clarifications and final scope together. They should become contract documents, not disappear after negotiation.", points: ["Record reasons for material substitutions", "Attach the final programme and payment plan", "Resolve qualifications before signing"] },
    ],
    faq: [
      { question: "How do I compare two contractor quotations?", answer: "Put both against one scope and quantity structure, then align specifications, omissions, exclusions, taxes, programme, payment terms, warranty and change rules before comparing the adjusted total." },
      { question: "Why is the lowest quotation not always cheapest?", answer: "It may exclude work, use lower specifications, defer quantities as provisional, require earlier cash or leave risks with the client. Compare total obligations, not only the headline." },
      { question: "What should become part of the contract?", answer: "Include the accepted quotation, drawings, specifications, clarification log, exclusions, programme, payment stages, change procedure, warranty and handover requirements." },
    ],
  },
  {
    slug: "interior-designer-vs-contractor",
    aliases: ["designer-vs-contractor"],
    serviceName: "Interior Designer vs Contractor Guide",
    intent: "informational",
    title: "Interior Designer vs Contractor in {city}: Who Do You Need?",
    description: "Compare an interior designer vs contractor for a {city} project: design responsibility, procurement, supervision, cost control, contracts and handover.",
    h1: "Interior designer vs contractor for a {city} project",
    introduction: "An interior designer and a contractor solve different parts of a project, although some firms combine both. Choose a delivery structure by assigning responsibility for design, pricing, procurement, supervision and quality before requesting proposals.",
    localInsights: "For projects in {city}, {state}, a design-only model can give the client more tender control but requires coordination. A turnkey model creates one primary delivery interface but still needs a precise scope and independent decision checks.",
    keywords: ["interior designer vs contractor", "interior designer or contractor", "interior designer vs contractor {city}"],
    sections: [
      { heading: "Understand the roles", body: "Designers typically develop the brief, drawings and specifications. Contractors plan labour, procurement and construction. Confirm the actual service offered rather than relying on the title.", points: ["Assign drawings and specification ownership", "Name site-supervision responsibility", "Define who certifies quality and payments"] },
      { heading: "Compare delivery models", body: "Separate design and construction can create competitive tendering and clearer design advocacy. Turnkey can simplify coordination. Each model needs transparent fees and changes.", points: ["Compare design-only, managed and turnkey scope", "Identify conflicts and independent checks", "Review who carries coordination risk"] },
      { heading: "Choose for project complexity", body: "A small defined package may suit direct contractor delivery. Layout changes, custom detailing or multiple services may benefit from stronger design and coordination input.", points: ["Match capability to scope and risk", "Budget for coordination, not only production", "Document deliverables at every stage"] },
    ],
    faq: [
      { question: "Do I need an interior designer or a contractor?", answer: "If the design is unresolved or coordination is complex, design input is valuable. If the scope is already documented, a suitable contractor may execute it. Many projects use both." },
      { question: "Is a turnkey interior contractor the same as an interior designer?", answer: "Not necessarily. Turnkey describes consolidated delivery responsibility. Confirm the depth of design service, named designers, drawings, specifications and approval process." },
      { question: "Who should manage quality and payments?", answer: "The contract should assign inspections and certification. On higher-risk projects, an independent designer or project manager can provide an additional check." },
    ],
  },
  {
    slug: "renovation-project-management",
    aliases: ["renovation-management", "renovation-budget-tracking", "construction-project-management-software", "interior-project-management-software"],
    serviceName: "Renovation Project Management",
    intent: "commercial",
    title: "Renovation & Interior Project Management in {city} | Sajivo",
    description: "Manage a renovation or interior project in {city} with structured scope, quotation comparison, milestones, budget tracking, files, decisions and handover.",
    h1: "Renovation and interior project management in {city}",
    introduction: "Renovation management works best when scope, decisions, cost, progress and evidence share one baseline. A project workspace can support budget and renovation tracking, but clear responsibilities and timely site verification still matter.",
    localInsights: "For a project in {city}, {state}, record building permissions, access windows, deliveries, inspections and local dependencies in the programme. Keep conversations connected to tasks, files, approvals and change records.",
    keywords: ["renovation management", "renovation budget", "renovation tracking", "renovation fraud", "construction project management software", "interior project management software"],
    sections: [
      { heading: "Establish one project baseline", body: "Connect scope, programme, budget and responsibilities before work starts. Every approved change should update the relevant records rather than living only in messages.", points: ["Set milestones, owners and acceptance criteria", "Store current drawings and specifications", "Link payment stages to verified deliverables"] },
      { heading: "Track forecast, not only spend", body: "Paid-to-date shows history. Budget control also needs committed orders, pending changes, contingency use and a current forecast to completion.", points: ["Separate original, approved and forecast cost", "Review variance by work package", "Keep invoices and approvals attached"] },
      { heading: "Create a defensible handover", body: "A complete record reduces ambiguity and fraud risk without claiming to eliminate it. Close tasks, defects, warranties, manuals, final accounts and access information deliberately.", points: ["Use dated progress and inspection evidence", "Track snag ownership and closure", "Archive final drawings and warranties"] },
    ],
    faq: [
      { question: "What should renovation project management software track?", answer: "Useful software connects scope, tasks, milestones, files, decisions, quotations, contracts, budget, payments, changes, defects and handover records with clear owners and dates." },
      { question: "Can software prevent renovation fraud?", answer: "Software can improve traceability and surface inconsistencies, but it cannot guarantee conduct or workmanship. Identity checks, site verification, sound contracts and controlled payments remain necessary." },
      { question: "How should I track a renovation budget?", answer: "Track the original budget, accepted contracts, approved changes, paid amounts, pending exposure, contingency use and forecast at completion by work package." },
    ],
  },
  {
    slug: "architects",
    aliases: ["architect"],
    serviceName: "Architects",
    intent: "local",
    title: "Architects in {city} | Compare Project Scope & Services",
    description: "Compare architects in {city} by relevant work, design stages, approval support, consultant coordination, fees, site services and deliverables.",
    h1: "Architects in {city} for residential and commercial projects",
    introduction: "Choose an architect by matching project type, service depth, design approach and delivery involvement. Compare the same brief, stage deliverables, consultant responsibilities, fees and site services for your {city} project.",
    localInsights: "For work in {city}, {state}, clarify local approval support, survey and consultant inputs, site-visit frequency, tender assistance and responsibility for record drawings before appointment.",
    keywords: ["architects in {city}", "architect near me", "residential architect {city}", "commercial architect {city}"],
    sections: [
      { heading: "Define the appointment", body: "Architectural service can stop at concept design or continue through approvals, construction information, tendering and site review. List stage outputs explicitly.", points: ["Name drawings and submission deliverables", "Assign structural and services coordination", "Agree meetings, revisions and site visits"] },
      { heading: "Review relevant evidence", body: "Look beyond visual style. Ask how comparable projects handled constraints, budget, approvals, documentation and construction-stage decisions.", points: ["Review built work similar in type and scale", "Speak with recent clients where possible", "Meet the people assigned to your project"] },
      { heading: "Compare fees with scope", body: "Percentage, lump-sum and stage fees are meaningful only beside deliverables, exclusions, reimbursables and additional-service rates.", points: ["Align stage scope before comparing fees", "Record payment triggers and suspension terms", "Clarify copyright and drawing-use rights"] },
    ],
    faq: [
      { question: "How do I compare architects in {city}?", answer: "Use one project brief and compare relevant built work, team, design stages, approvals, consultant coordination, tender support, site services, deliverables, exclusions and fees." },
      { question: "Does an architect supervise construction?", answer: "Only if the appointment includes construction-stage services. Define visit frequency, inspection scope, reporting, certification and the contractor's continuing responsibility for workmanship." },
      { question: "What should an architect's proposal include?", answer: "It should state scope by stage, deliverables, programme, team, client inputs, consultants, approvals, site services, fees, taxes, reimbursables, exclusions and additional services." },
    ],
  },
];

const interpolate = (value: string, city: string, state: string) =>
  value.replaceAll("{city}", city).replaceAll("{state}", state);

export const toSeoSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

const templateBySlug = new Map<string, SeoTemplate>();
for (const template of templates) {
  templateBySlug.set(template.slug, template);
  for (const alias of template.aliases) templateBySlug.set(alias, template);
}

export const PROGRAMMATIC_SEO_SLUGS = templates.map((template) => template.slug);

export const PROGRAMMATIC_SEO_TEMPLATES = templates.map(({ slug, serviceName, intent, keywords }) => ({
  slug,
  serviceName,
  intent,
  keywords,
}));

export function getSeoTemplate(value: string) {
  return templateBySlug.get(value);
}

export function buildProgrammaticSeoContent(value: string, city: string, state: string): ProgrammaticSeoContent | null {
  const template = getSeoTemplate(value);
  if (!template) return null;

  const map = (text: string) => interpolate(text, city, state);
  return {
    slug: template.slug,
    serviceName: template.serviceName,
    intent: template.intent,
    title: map(template.title),
    description: map(template.description),
    h1: map(template.h1),
    introduction: map(template.introduction),
    localInsights: map(template.localInsights),
    keywords: template.keywords.map(map),
    sections: template.sections.map((section) => ({
      heading: map(section.heading),
      body: map(section.body),
      points: section.points.map(map),
    })),
    faq: template.faq.map((item) => ({ question: map(item.question), answer: map(item.answer) })),
  };
}
