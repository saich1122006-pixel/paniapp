const fs = require('fs');

const enPath = 'src/i18n/locales/en.json';
const hiPath = 'src/i18n/locales/hi.json';
const tePath = 'src/i18n/locales/te.json';

const en = JSON.parse(fs.readFileSync(enPath));
const hi = JSON.parse(fs.readFileSync(hiPath));
const te = JSON.parse(fs.readFileSync(tePath));

const additions = {
  recruiter_wallet: {
    payment_history: { en: "Payment History", hi: "भुगतान इतिहास", te: "చెల్లింపు చరిత్ర" },
    no_payments: { en: "No Payments", hi: "कोई भुगतान नहीं", te: "చెల్లింపులు లేవు" },
    payment_history_msg: { en: "You haven't made any payments yet.", hi: "आपने अभी तक कोई भुगतान नहीं किया है।", te: "మీరు ఇంకా ఎలాంటి చెల్లింపులు చేయలేదు." }
  },
  worker_wallet: {
    payment_history: { en: "Payment History", hi: "भुगतान इतिहास", te: "చెల్లింపు చరిత్ర" },
    no_payments: { en: "No Payments", hi: "कोई भुगतान नहीं", te: "చెల్లింపులు లేవు" },
    payment_history_msg: { en: "You haven't received any payments yet.", hi: "आपको अभी तक कोई भुगतान नहीं मिला है।", te: "మీకు ఇంకా ఎలాంటి చెల్లింపులు అందలేదు." }
  },
  post_job: {
    amount_label: { en: "Amount (₹)", hi: "राशि (₹)", te: "మొత్తం (₹)" },
    amount_hint: { en: "Total pay", hi: "कुल वेतन", te: "మొత్తం వేతనం" },
    hours_label: { en: "Hours", hi: "घंटे", te: "గంటలు" },
    hours_hint: { en: "Est. duration", hi: "अनुमानित अवधि", te: "అంచనా వ్యవధి" },
    job_location_label: { en: "JOB LOCATION", hi: "नौकरी का स्थान", te: "పని ప్రదేశం" },
    current_location: { en: "Current Location", hi: "वर्तमान स्थान", te: "ప్రస్తుత స్థానం" },
    place_of_work: { en: "Place of Work", hi: "काम करने की जगह", te: "పని ప్రదేశం" },
    manual_address: { en: "Or enter address manually", hi: "या मैन्युअल रूप से पता दर्ज करें", te: "లేదా మాన్యువల్‌గా చిరునామాను నమోదు చేయండి" }
  },
  find_workers: {
    ready_count: { en: "{{count}} workers ready for work", hi: "काम के लिए तैयार {{count}} कर्मचारी", te: "{{count}} కార్మికులు పని చేయడానికి సిద్ధంగా ఉన్నారు" },
    search_title: { en: "Search for workers", hi: "कर्मचारियों की खोज करें", te: "కార్మికుల కోసం శోధించండి" },
    search_subtitle: { en: "Type a name or skill to find workers ready for work", hi: "कर्मचारियों को खोजने के लिए कोई नाम या कौशल टाइप करें", te: "కార్మికులను కనుగొనడానికి పేరు లేదా నైపుణ్యాన్ని టైప్ చేయండి" }
  },
  profile: {
    help_support: { en: "Help & Support", hi: "सहायता और समर्थन", te: "సహాయం & మద్దతు" },
    terms: { en: "Terms of Service", hi: "सेवा की शर्तें", te: "సేవా నిబంధనలు" },
    privacy: { en: "Privacy Policy", hi: "गोपनीयता नीति", te: "గోప్యతా విధానం" }
  },
  job: {
    for_hours: { en: "for {{hours}} hrs", hi: "{{hours}} घंटे के लिए", te: "{{hours}} గంటల పాటు" }
  },
  status: {
    open: { en: "OPEN", hi: "खुला", te: "ఓపెన్" },
    matched: { en: "MATCHED", hi: "मैच हो गया", te: "సరిపోలింది" },
    completed: { en: "COMPLETED", hi: "पूरा हो गया", te: "పూర్తయింది" },
    cancelled: { en: "CANCELLED", hi: "रद्द", te: "రద్దు చేయబడింది" }
  }
};

for (const section in additions) {
  if (!en[section]) en[section] = {};
  if (!hi[section]) hi[section] = {};
  if (!te[section]) te[section] = {};
  
  for (const key in additions[section]) {
    en[section][key] = additions[section][key].en;
    hi[section][key] = additions[section][key].hi;
    te[section][key] = additions[section][key].te;
  }
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(hiPath, JSON.stringify(hi, null, 2));
fs.writeFileSync(tePath, JSON.stringify(te, null, 2));

console.log('Translations added successfully.');
