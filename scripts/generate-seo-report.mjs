import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const output = join(root, "output/pdf/Sajivo_High_Intent_SEO_Implementation_Report.pdf");
const tempDir = join(root, "tmp/pdfs");
const tempScript = join(tempDir, "generate_sajivo_seo_report.py");

mkdirSync(dirname(output), { recursive: true });
mkdirSync(tempDir, { recursive: true });

const routeMap = [
  ["Best interior designer near me", "interior-designers"],
  ["Best contractor near me", "home-renovation"],
  ["Reliable contractor for home renovation", "home-renovation"],
  ["Home renovation contractor", "home-renovation"],
  ["Interior designer for 3BHK", "interior-designers"],
  ["Office interior contractor", "office-interior-contractors"],
  ["Commercial interior contractor", "office-interior-contractors"],
  ["Home renovation cost", "renovation-cost"],
  ["Interior design cost per sq ft", "interior-design-cost"],
  ["House renovation cost", "renovation-cost"],
  ["Construction cost estimate", "civil-contractors"],
  ["Modular kitchen cost", "modular-kitchen"],
  ["Bathroom renovation cost", "bathroom-renovation-cost"],
  ["False ceiling cost", "false-ceiling-cost"],
  ["How to choose a contractor", "contractor-credibility"],
  ["How to check contractor credibility", "contractor-credibility"],
  ["Contractor quotation comparison", "quotation-comparison"],
  ["Interior designer vs contractor", "interior-designer-vs-contractor"],
  ["Turnkey interior contractor", "home-renovation"],
  ["How to manage home renovation", "renovation-project-management"],
  ["How to avoid contractor fraud", "contractor-credibility"],
  ["How to control renovation budget", "renovation-project-management"],
  ["How to track construction project", "renovation-project-management"],
  ["Construction project management software", "renovation-project-management"],
  ["Interior project management software", "renovation-project-management"],
];

const routes = routeMap.map(([phrase, routeSlug]) => ({
  phrase,
  route: `https://sajivo-app.vercel.app/in/uttar-pradesh/lucknow/${routeSlug}`,
}));

const python = String.raw`
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
import json
import os

OUTPUT = ${JSON.stringify(output)}
ROUTES = json.loads(${JSON.stringify(JSON.stringify(routes))})

NAVY = colors.HexColor("#102A43")
CORAL = colors.HexColor("#D85F42")
INK = colors.HexColor("#17212B")
MUTED = colors.HexColor("#5B6773")
PALE = colors.HexColor("#F4F6F8")
LINE = colors.HexColor("#D9E0E6")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="ReportTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=30, textColor=NAVY, alignment=TA_CENTER, spaceAfter=8))
styles.add(ParagraphStyle(name="Subtitle", parent=styles["Normal"], fontSize=11, leading=17, textColor=MUTED, alignment=TA_CENTER))
styles.add(ParagraphStyle(name="H1x", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=NAVY, spaceAfter=10))
styles.add(ParagraphStyle(name="H2x", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13, leading=17, textColor=CORAL, spaceBefore=6, spaceAfter=6))
styles.add(ParagraphStyle(name="Bodyx", parent=styles["BodyText"], fontSize=9.5, leading=14, textColor=INK, spaceAfter=6))
styles.add(ParagraphStyle(name="Smallx", parent=styles["BodyText"], fontSize=7.5, leading=10, textColor=INK))
styles.add(ParagraphStyle(name="Tinyx", parent=styles["BodyText"], fontSize=6.7, leading=8.5, textColor=INK))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(18*mm, 14*mm, 192*mm, 14*mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18*mm, 9*mm, "Sajivo - High-Intent SEO Implementation Report")
    canvas.drawRightString(192*mm, 9*mm, f"Page {doc.page}")
    canvas.restoreState()

doc = SimpleDocTemplate(OUTPUT, pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=18*mm, bottomMargin=19*mm, title="Sajivo High-Intent SEO Implementation Report", author="Sajivo")
story = []

story += [Spacer(1, 25*mm), Paragraph("SAJIVO", styles["ReportTitle"]), Paragraph("High-Intent Programmatic SEO & LLM Discovery Implementation Report", styles["ReportTitle"]), Spacer(1, 7*mm), Paragraph("Route inventory, technical controls, admin coverage and verification record", styles["Subtitle"]), Spacer(1, 20*mm)]
cover = Table([["Scope", "25 supplied high-intent search phrases"], ["Reference city", "Lucknow, Uttar Pradesh"], ["Public directory", "https://sajivo-app.vercel.app/seo-directory"], ["Ranking position", "Not guaranteed; determined by search engines"]], colWidths=[42*mm, 112*mm])
cover.setStyle(TableStyle([("BACKGROUND", (0,0), (0,-1), PALE), ("TEXTCOLOR", (0,0), (0,-1), NAVY), ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"), ("FONTNAME", (1,0), (1,-1), "Helvetica"), ("FONTSIZE", (0,0), (-1,-1), 9), ("GRID", (0,0), (-1,-1), .4, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 7), ("RIGHTPADDING", (0,0), (-1,-1), 7), ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7)]))
story += [cover, PageBreak()]

story += [Paragraph("1. Executive summary", styles["H1x"]), Paragraph("Sajivo's high-intent SEO implementation organizes the supplied searches into controlled, location-specific routes. Each route is intended to answer a distinct project-planning or professional-discovery need while keeping navigation, canonical URLs and structured page data consistent.", styles["Bodyx"]), Paragraph("This report documents implementation coverage. It does not claim or guarantee a particular search ranking. Indexing and ranking remain subject to search-engine crawling, quality assessment, competition, authority and user signals.", styles["Bodyx"]), Spacer(1, 3*mm), Paragraph("Implementation outcomes", styles["H2x"])]
for item in ["One public, crawlable directory linking approved city and keyword routes.", "A controlled manifest for all 25 supplied high-intent phrases.", "Location-aware titles, descriptions, headings, body sections and FAQs.", "Admin visibility for keyword coverage and route lifecycle management.", "Verification fields for deployment, crawlability, metadata, structured data and content review."]:
    story.append(Paragraph("- " + item, styles["Bodyx"]))

story += [Spacer(1, 5*mm), Paragraph("2. Search intent architecture", styles["H1x"]), Paragraph("The route set covers local commercial discovery, cost planning, contractor due diligence, quotation comparison and project-management education. City context is explicit in the URL and on-page copy. Pages should remain useful without relying on keyword repetition.", styles["Bodyx"])]
intent_rows = [["Intent cluster", "Representative searches", "Primary user outcome"], ["Professional discovery", "Designer, contractor, commercial fit-out", "Create a relevant brief and compare providers"], ["Cost planning", "Renovation, kitchen, bathroom, ceiling, construction", "Understand cost drivers and prepare quotations"], ["Trust and selection", "Credibility, fraud, quote comparison", "Perform due diligence and reduce ambiguity"], ["Delivery management", "Budget, tracking, project software", "Manage milestones, evidence and handover"]]
intent_table = Table([[Paragraph(c, styles["Smallx"]) for c in row] for row in intent_rows], colWidths=[40*mm, 62*mm, 58*mm], repeatRows=1)
intent_table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), NAVY), ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"), ("GRID", (0,0), (-1,-1), .4, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"), ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, PALE]), ("LEFTPADDING", (0,0), (-1,-1), 5), ("RIGHTPADDING", (0,0), (-1,-1), 5), ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6)]))
story += [intent_table, PageBreak()]

story += [Paragraph("3. Keyword and route inventory", styles["H1x"]), Paragraph("The following reference links use Lucknow. The same controlled route set is generated for every approved city in the application manifest.", styles["Bodyx"])]
route_rows = [[Paragraph("#", styles["Smallx"]), Paragraph("High-intent phrase", styles["Smallx"]), Paragraph("Reference route", styles["Smallx"])]]
for index, item in enumerate(ROUTES, 1):
    route_rows.append([Paragraph(str(index), styles["Tinyx"]), Paragraph(item["phrase"], styles["Tinyx"]), Paragraph(item["route"], styles["Tinyx"])])
route_table = Table(route_rows, colWidths=[9*mm, 56*mm, 95*mm], repeatRows=1)
route_table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), NAVY), ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"), ("GRID", (0,0), (-1,-1), .35, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"), ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, PALE]), ("LEFTPADDING", (0,0), (-1,-1), 4), ("RIGHTPADDING", (0,0), (-1,-1), 4), ("TOPPADDING", (0,0), (-1,-1), 4), ("BOTTOMPADDING", (0,0), (-1,-1), 4)]))
story += [route_table, PageBreak()]

story += [Paragraph("4. Technical SEO checklist", styles["H1x"])]
technical = [
    ("Crawl path", "Directory uses ordinary anchor links to every approved city-keyword route."),
    ("Index directives", "Directory and published route pages specify index, follow; unsupported routes should remain noindex or 404."),
    ("Canonical URL", "Self-referencing absolute canonical URL is emitted for each indexable page."),
    ("Metadata", "Unique title and description include the page topic and city without keyword stuffing."),
    ("Semantic structure", "One descriptive H1, ordered section headings, lists, navigation and meaningful link text."),
    ("Structured data", "Applicable Service or Article, BreadcrumbList and FAQPage JSON-LD reflects visible content."),
    ("Sitemap", "Approved canonical routes are eligible for inclusion in the XML sitemap."),
    ("Internal linking", "Directory, related-topic links and calls to action provide discoverable crawl paths."),
    ("Content quality", "City-specific constraints, decision guidance, caveats and next steps create practical value."),
    ("Performance", "Server-rendered text and restrained page composition support fast discovery and rendering."),
]
for label, detail in technical:
    story.append(KeepTogether([Paragraph(label, styles["H2x"]), Paragraph(detail, styles["Bodyx"])]))

story += [PageBreak(), Paragraph("5. LLM and answer-engine readiness", styles["H1x"]), Paragraph("The pages use explicit entities, locations, service names, questions and concise answers so automated systems can understand the topic and cite a useful passage. This supports discoverability but does not guarantee inclusion in an AI-generated answer.", styles["Bodyx"])]
for item in ["Use plain-language definitions before detailed advice.", "Keep factual claims bounded and avoid unsupported superlatives.", "Expose FAQs in visible HTML and keep structured data consistent with it.", "State that estimates are planning guidance rather than binding quotations.", "Use location and service entities consistently across metadata, headings and breadcrumbs.", "Offer concrete comparison criteria, process steps and safety caveats."]:
    story.append(Paragraph("- " + item, styles["Bodyx"]))

story += [Spacer(1, 5*mm), Paragraph("6. Admin coverage", styles["H1x"]), Paragraph("The super-admin SEO control plane should expose the approved keyword catalog, city coverage, publication state, metadata preview, canonical route, updated time and verification status. Changes should remain constrained to approved templates so unreviewed arbitrary pages are not published at scale.", styles["Bodyx"])]
admin_rows = [["Control", "Expected behavior"], ["Keyword catalog", "Shows all 25 phrases and their controlled slugs"], ["City coverage", "Shows route availability for each approved city"], ["Publish state", "Draft, published and archived states are explicit"], ["Metadata preview", "Title, description, canonical and index directive are reviewable"], ["Quality status", "Content, structured data and live response checks are recorded"], ["Auditability", "Updated-by and updated-at fields preserve ownership"]]
admin_table = Table([[Paragraph(c, styles["Smallx"]) for c in row] for row in admin_rows], colWidths=[45*mm, 115*mm], repeatRows=1)
admin_table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), NAVY), ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("GRID", (0,0), (-1,-1), .4, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"), ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, PALE]), ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6), ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6)]))
story += [admin_table, PageBreak()]

story += [Paragraph("7. Verification record", styles["H1x"]), Paragraph("Complete these fields after deployment. A generated route is not considered verified solely because it exists in source code.", styles["Bodyx"])]
verification = [["Check", "Status", "Evidence / date"], ["Production build succeeds", "Pending verification", ""], ["Directory returns HTTP 200", "Pending verification", ""], ["25 Lucknow routes return expected response", "Pending verification", ""], ["Approved-city route sampling completed", "Pending verification", ""], ["Canonical tags match public URLs", "Pending verification", ""], ["Robots directives allow published pages", "Pending verification", ""], ["XML sitemap contains canonical routes", "Pending verification", ""], ["Structured data validates", "Pending verification", ""], ["Mobile and desktop visual review completed", "Pending verification", ""], ["Admin catalog displays 25 phrases", "Pending verification", ""]]
verification_table = Table([[Paragraph(c, styles["Smallx"]) for c in row] for row in verification], colWidths=[72*mm, 42*mm, 46*mm], repeatRows=1)
verification_table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), NAVY), ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("GRID", (0,0), (-1,-1), .4, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"), ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, PALE]), ("LEFTPADDING", (0,0), (-1,-1), 5), ("RIGHTPADDING", (0,0), (-1,-1), 5), ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7)]))
story += [verification_table, Spacer(1, 8*mm), Paragraph("Search performance follow-up", styles["H2x"]), Paragraph("After release, submit or refresh the sitemap in the appropriate webmaster tools, monitor discovered and indexed URLs, review query impressions and landing-page engagement, and improve pages that do not satisfy the search intent. Avoid creating thin city pages whose only difference is a place name.", styles["Bodyx"])]

story += [PageBreak(), Paragraph("8. Release and governance notes", styles["H1x"])]
for heading, body in [
    ("Controlled publishing", "Only approved keywords and cities should produce indexable pages. Unknown combinations should not silently become indexable content."),
    ("Human review", "Review local relevance, wording, factual accuracy and calls to action before publishing a new city cluster."),
    ("Data ownership", "Admin changes should be authenticated, role-checked and logged. Public routes should read only published records."),
    ("Measurement", "Track impressions, clicks, qualified enquiries and downstream conversion by route cluster instead of treating page count as success."),
    ("No ranking guarantee", "Technical readiness enables crawling and evaluation; it cannot promise placement for competitive terms."),
]:
    story += [Paragraph(heading, styles["H2x"]), Paragraph(body, styles["Bodyx"])]

story += [Spacer(1, 8*mm), Paragraph("9. Sign-off", styles["H1x"])]
signoff = Table([["Implementation owner", "____________________________"], ["Content reviewer", "____________________________"], ["Production verifier", "____________________________"], ["Release date", "____________________________"]], colWidths=[52*mm, 108*mm])
signoff.setStyle(TableStyle([("GRID", (0,0), (-1,-1), .4, LINE), ("BACKGROUND", (0,0), (0,-1), PALE), ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"), ("FONTSIZE", (0,0), (-1,-1), 9), ("LEFTPADDING", (0,0), (-1,-1), 7), ("RIGHTPADDING", (0,0), (-1,-1), 7), ("TOPPADDING", (0,0), (-1,-1), 9), ("BOTTOMPADDING", (0,0), (-1,-1), 9)]))
story += [signoff]

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUTPUT)
`;

writeFileSync(tempScript, python, "utf8");
const result = spawnSync("python3", [tempScript], { cwd: root, encoding: "utf8" });
rmSync(tempScript, { force: true });

if (result.error) throw result.error;
if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout);
  process.exit(result.status || 1);
}

process.stdout.write(`Created ${output}\n`);
