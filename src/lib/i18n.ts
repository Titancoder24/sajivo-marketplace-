import i18next from "i18next";

const hindi: Record<string, string> = {
  Explore: "खोजें", Services: "सेवाएं", Professionals: "विशेषज्ञ", "How Sajivo Works": "साजिवो कैसे काम करता है", "For professionals": "विशेषज्ञों के लिए", "Log in": "लॉग इन", "Start a Project": "प्रोजेक्ट शुरू करें", Search: "खोजें", "Find pros": "विशेषज्ञ खोजें", Account: "खाता",
  "A clearer way to build, renovate and manage your project": "अपने प्रोजेक्ट को बनाने, नवीनीकरण और प्रबंधन का सरल तरीका", "Build, renovate and transform your space — with everyone on the same page.": "अपनी जगह बनाएं, नवीनीकरण करें और बदलें — सभी को एक ही जानकारी के साथ।", "Tell us what you need, discover relevant professionals and suppliers, compare proposals, and manage your project from start to completion.": "अपनी जरूरत बताएं, सही विशेषज्ञ और आपूर्तिकर्ता खोजें, प्रस्तावों की तुलना करें और प्रोजेक्ट को शुरुआत से पूरा होने तक संभालें।", "What do you need?": "आपको क्या चाहिए?", "Where?": "कहां?", "Designer, contractor, kitchen renovation...": "डिजाइनर, ठेकेदार, किचन नवीनीकरण...", Bengaluru: "बेंगलुरु", "Find Professionals": "विशेषज्ञ खोजें", "Verified professionals": "सत्यापित विशेषज्ञ", "Structured proposals": "सुव्यवस्थित प्रस्ताव", "Managed workspace": "प्रबंधित कार्यक्षेत्र",
  "Everything your project needs, connected in one ecosystem.": "आपके प्रोजेक्ट की हर जरूरत, एक ही नेटवर्क में जुड़ी हुई।", Clients: "क्लाइंट", "Project owners and service seekers": "प्रोजेक्ट मालिक और सेवा खोजने वाले", "Designers, contractors, and specialists": "डिजाइनर, ठेकेदार और विशेषज्ञ", Businesses: "व्यवसाय", "Retailers and future suppliers": "रिटेलर और भविष्य के आपूर्तिकर्ता", "One workspace for the entire project.": "पूरे प्रोजेक्ट के लिए एक कार्यक्षेत्र।", "Briefs, proposals, documents, milestones, people, messages, issues, and payment history stay organized in one place.": "ब्रीफ, प्रस्ताव, दस्तावेज, माइलस्टोन, लोग, संदेश, समस्याएं और भुगतान इतिहास एक ही जगह व्यवस्थित रहें।", Overview: "अवलोकन", Budget: "बजट", Milestones: "माइलस्टोन", Documents: "दस्तावेज", People: "लोग", Messages: "संदेश", Issues: "समस्याएं", Payments: "भुगतान",
  "More transparency. Fewer surprises.": "अधिक पारदर्शिता। कम आश्चर्य।", "A clearer way to move from brief to completion.": "ब्रीफ से पूरा होने तक आगे बढ़ने का सरल तरीका।", "Verified professional profiles": "सत्यापित विशेषज्ञ प्रोफाइल", "Defined project scope": "स्पष्ट प्रोजेक्ट दायरा", "Milestone tracking": "माइलस्टोन ट्रैकिंग", "Document management": "दस्तावेज प्रबंधन", "Reviews and ratings": "समीक्षाएं और रेटिंग", "Your project starts with one brief.": "आपका प्रोजेक्ट एक ब्रीफ से शुरू होता है।", "Explore by service": "सेवा के अनुसार खोजें", "What are you planning?": "आप क्या योजना बना रहे हैं?", "Meet trusted professionals": "विश्वसनीय विशेषज्ञों से मिलें", "Browse verified local experts, see their work, and compare services before you start a conversation.": "स्थानीय सत्यापित विशेषज्ञों का काम देखें और बातचीत शुरू करने से पहले सेवाओं की तुलना करें।", "Browse all": "सभी देखें", "Ideas for every room": "हर कमरे के लिए विचार", "Find your direction": "अपनी दिशा खोजें", "Save the feeling you love, then share it with professionals in your project brief.": "अपनी पसंद की शैली सहेजें और उसे अपने प्रोजेक्ट ब्रीफ में विशेषज्ञों के साथ साझा करें।", "From first idea to final handover": "पहले विचार से अंतिम हैंडओवर तक", "From your first idea to final handover.": "पहले विचार से अंतिम हैंडओवर तक।", "Create your brief": "अपना ब्रीफ बनाएं", "Discover": "खोजें", "Compare": "तुलना करें", "Hire": "नियुक्त करें", "Manage": "प्रबंधन करें", "Complete": "पूरा करें", "The Sajivo ecosystem": "साजिवो का नेटवर्क", "Project workspace": "प्रोजेक्ट कार्यक्षेत्र", "Ready when you are": "जब आप तैयार हों, हम तैयार हैं", "Design": "डिजाइन", "Ceiling": "सीलिंग", "Wall": "दीवार", "Flooring": "फर्श", "Execution": "निर्माण", "Full Home Interior Design": "पूरे घर का इंटीरियर डिजाइन", "Modular Kitchen Design": "मॉड्यूलर किचन डिजाइन", "False Ceiling": "फॉल्स सीलिंग", "Wall Paneling": "दीवार पैनलिंग", "Flooring Installation": "फर्श इंस्टॉलेशन", "End-to-End Execution": "शुरू से अंत तक निर्माण", "Warm minimal": "सॉफ्ट मिनिमल", "Soft modern": "सॉफ्ट मॉडर्न", "Quiet luxury": "शांत लक्जरी", "Living room": "लिविंग रूम", "Kitchen": "किचन", "Bedroom": "बेडरूम", "Join as a pro": "विशेषज्ञ के रूप में जुड़ें",
  "Login to Sajivo": "साजिवो में लॉग इन करें", "Use your customer, designer, or contractor account.": "अपने क्लाइंट, डिजाइनर या ठेकेदार खाते का उपयोग करें।", "Email address": "ईमेल पता", Password: "पासवर्ड", "Keep me signed in": "मुझे साइन इन रखें", "Secure login": "सुरक्षित लॉग इन", "Sign in": "साइन इन", "Demo account": "डेमो खाता", "Use the pre-filled credentials to explore the customer dashboard.": "कस्टमर डैशबोर्ड देखने के लिए पहले से भरी जानकारी का उपयोग करें।", "Forgot password?": "पासवर्ड भूल गए?", "Create your Sajivo account": "अपना साजिवो खाता बनाएं", "Choose your account type": "अपने खाते का प्रकार चुनें", "Client account": "क्लाइंट खाता", "Business account": "व्यवसाय खाता", "Create account": "खाता बनाएं", "Create client account": "क्लाइंट खाता बनाएं", "Create business account": "व्यवसाय खाता बनाएं",
  "Light theme": "लाइट थीम", "Grey theme": "ग्रे थीम", "Dark theme": "डार्क थीम", "Switch language to Hindi": "हिंदी में बदलें", "Switch language to English": "अंग्रेजी में बदलें", "English / Hindi": "अंग्रेजी / हिंदी", "View all": "सभी देखें", "Start a project": "प्रोजेक्ट शुरू करें", Privacy: "गोपनीयता", Terms: "नियम", "Interior projects, made clearer.": "इंटीरियर प्रोजेक्ट, अब और आसान।", "A clearer way to discover trusted interior professionals and manage every decision from brief to handover.": "विश्वसनीय इंटीरियर विशेषज्ञ खोजने और ब्रीफ से हैंडओवर तक हर निर्णय संभालने का सरल तरीका।", "Curated for your project": "आपके प्रोजेक्ट के लिए चुना गया",
};

const instance = i18next.createInstance({ fallbackLng: "en", resources: { en: { translation: {} }, hi: { translation: hindi } }, interpolation: { escapeValue: false } });
void instance.init();

type SourceNode = Text | HTMLElement;

function collectSourceNodes() {
  const nodes: SourceNode[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;
    const value = node.textContent?.trim();
    if (!parent || !value || value.length < 2 || parent.closest("script,style,noscript,svg")) continue;
    nodes.push(node);
  }
  document.querySelectorAll<HTMLElement>("input,textarea,[aria-label],[title]").forEach((element) => nodes.push(element));
  return nodes;
}

function sourceValue(node: SourceNode) {
  if (node instanceof HTMLElement) return node.getAttribute("placeholder") ?? node.getAttribute("aria-label") ?? node.getAttribute("title") ?? "";
  return node.textContent?.trim() ?? "";
}

function setTranslatedValue(node: SourceNode, translated: string) {
  if (node instanceof HTMLElement) {
    for (const attribute of ["placeholder", "aria-label", "title"]) {
      const original = node.getAttribute(`data-sajivo-${attribute}`);
      if (original) node.setAttribute(attribute, translated === original ? original : translated);
    }
    return;
  }
  const original = node.textContent?.trim() ?? "";
  if (original && node.textContent) node.textContent = node.textContent.replace(original, translated);
}

async function translateUnmapped(values: string[]) {
  if (!values.length) return new Map<string, string>();
  const result = new Map<string, string>();
  for (let index = 0; index < values.length; index += 30) {
    const batch = values.slice(index, index + 30);
    try {
      const response = await fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texts: batch }) });
      if (!response.ok) continue;
      const payload = await response.json() as { translations?: string[] };
      batch.forEach((value, batchIndex) => result.set(value, payload.translations?.[batchIndex] ?? value));
    } catch {
      // Keep original copy when the translation provider is temporarily unavailable.
    }
  }
  return result;
}

export async function translatePage(language: "en" | "hi") {
  if (language === "en") return;
  const nodes = collectSourceNodes();
  const values = [...new Set(nodes.map(sourceValue).filter(Boolean))];
  const translate = (value: string) => instance.t(value, { lng: language }) as string;
  const unmapped = values.filter((value) => translate(value) === value && !/[\u0900-\u097F]/.test(value));
  const remote = await translateUnmapped(unmapped);
  nodes.forEach((node) => {
    const value = sourceValue(node);
    if (!value) return;
    if (node instanceof HTMLElement) {
      for (const attribute of ["placeholder", "aria-label", "title"]) {
        const original = node.getAttribute(attribute);
        if (original) node.setAttribute(`data-sajivo-${attribute}`, original);
      }
    }
    setTranslatedValue(node, translate(value) === value ? (remote.get(value) ?? value) : translate(value));
  });
}
