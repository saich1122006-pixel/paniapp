const fs = require('fs');

const enPath = 'src/i18n/locales/en.json';
const hiPath = 'src/i18n/locales/hi.json';
const tePath = 'src/i18n/locales/te.json';

const en = JSON.parse(fs.readFileSync(enPath));
const hi = JSON.parse(fs.readFileSync(hiPath));
const te = JSON.parse(fs.readFileSync(tePath));

const newTranslations = {
  support: {
    title: { en: "Help & Support", hi: "सहायता और समर्थन", te: "సహాయం & మద్దతు" },
    subtitle: { en: "Report an issue or get help from our team.", hi: "किसी समस्या की रिपोर्ट करें या हमारी टीम से सहायता प्राप्त करें।", te: "సమస్యను నివేదించండి లేదా మా బృందం నుండి సహాయం పొందండి." },
    submit_ticket: { en: "Submit a Ticket", hi: "टिकट जमा करें", te: "టికెట్ సమర్పించండి" },
    subject: { en: "Subject *", hi: "विषय *", te: "విషయం *" },
    subject_placeholder: { en: "What is the issue about?", hi: "समस्या किस बारे में है?", te: "సమస్య దేని గురించి?" },
    description: { en: "Description *", hi: "विवरण *", te: "వివరణ *" },
    description_placeholder: { en: "Please provide details...", hi: "कृपया विवरण प्रदान करें...", te: "దయచేసి వివరాలను అందించండి..." },
    linked_job: { en: "Linked to Job ID: ", hi: "जॉब आईडी से लिंक: ", te: "జాబ్ IDకి లింక్ చేయబడింది: " },
    submit_btn: { en: "Submit Ticket", hi: "टिकट जमा करें", te: "టికెట్ సమర్పించండి" },
    past_tickets: { en: "Your Past Tickets", hi: "आपके पिछले टिकट", te: "మీ గత టిక్కెట్లు" },
    no_tickets: { en: "You haven't submitted any tickets yet.", hi: "आपने अभी तक कोई टिकट जमा नहीं किया है।", te: "మీరు ఇంకా ఎలాంటి టిక్కెట్లు సమర్పించలేదు." },
    fill_required: { en: "Please fill in all required fields", hi: "कृपया सभी आवश्यक फ़ील्ड भरें", te: "దయచేసి అవసరమైన అన్ని ఫీల్డ్‌లను పూరించండి" },
    success_msg: { en: "Your support ticket has been submitted successfully.", hi: "आपका सपोर्ट टिकट सफलतापूर्वक जमा कर दिया गया है।", te: "మీ మద్దతు టిక్కెట్ విజయవంతంగా సమర్పించబడింది." }
  },
  payment: {
    title: { en: "Make Payment", hi: "भुगतान करें", te: "చెల్లింపు చేయండి" },
    pay_for: { en: "Pay for ", hi: "के लिए भुगतान करें ", te: "దీనికి చెల్లించండి " },
    total_amount: { en: "Total Amount", hi: "कुल राशि", te: "మొత్తం మొత్తం" },
    paying: { en: "Paying: ", hi: "भुगतान प्राप्तकर्ता: ", te: "చెల్లింపు పొందుతున్నది: " },
    phone: { en: "Phone: ", hi: "फ़ोन: ", te: "ఫోన్: " },
    already_paid: { en: "Payment Already Made", hi: "भुगतान पहले ही हो चुका है", te: "చెల్లింపు ఇప్పటికే జరిగింది" },
    already_paid_text: { en: "This job has already been paid. You cannot make another payment.", hi: "इस काम का भुगतान पहले ही हो चुका है। आप दूसरा भुगतान नहीं कर सकते।", te: "ఈ పనికి ఇప్పటికే చెల్లించబడింది. మీరు మరొక చెల్లింపు చేయలేరు." },
    select_method: { en: "Select Payment Method", hi: "भुगतान विधि चुनें", te: "చెల్లింపు పద్ధతిని ఎంచుకోండి" },
    pay_now: { en: "Pay Now", hi: "अभी भुगतान करें", te: "ఇప్పుడే చెల్లించండి" },
    go_back: { en: "Go Back", hi: "वापस जाएं", te: "వెనక్కి వెళ్ళు" },
    pay_amount_now: { en: "Pay {{amount}} Now", hi: "अभी {{amount}} का भुगतान करें", te: "ఇప్పుడు {{amount}} చెల్లించండి" }
  },
  legal: {
    privacy_policy: { en: "Privacy Policy", hi: "गोपनीयता नीति", te: "గోప్యతా విధానం" },
    terms_of_service: { en: "Terms of Service", hi: "सेवा की शर्तें", te: "సేవా నిబంధనలు" },
    contact_us: { en: "Contact Us", hi: "संपर्क करें", te: "మమ్మల్ని సంప్రదించండి" }
  }
};

for (const key in newTranslations) {
  en[key] = {};
  hi[key] = {};
  te[key] = {};
  for (const subKey in newTranslations[key]) {
    en[key][subKey] = newTranslations[key][subKey].en;
    hi[key][subKey] = newTranslations[key][subKey].hi;
    te[key][subKey] = newTranslations[key][subKey].te;
  }
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(hiPath, JSON.stringify(hi, null, 2));
fs.writeFileSync(tePath, JSON.stringify(te, null, 2));
