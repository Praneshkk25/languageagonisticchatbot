"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    overview: "Overview",
    scholarships: "Scholarships",
    aiAssistant: "AI Assistant",
    documents: "Documents",
    helpCenter: "Help Center",
    signOut: "Sign Out",
    welcome: "Welcome back, Student",
    academicOverview: "Here's your academic overview for today.",
    pendingFees: "Pending Fees",
    attendance: "Attendance",
    assignments: "Assignments",
    latestNotices: "Latest Notices",
    noDues: "No dues",
    dueThisWeek: "Due this week",
    fromLastWeek: "from last week",
    viewAll: "View All",
    chatTitle: "Campus AI",
    chatStatus: "Active",
    chatPlaceholder: "Ask anything...",
    thinking: "Thinking...",
    errorConnecting: "Sorry, I am having trouble connecting to the server. Please ensure the backend is running.",
    helloAssistant: "Hello! I am your AI Campus Assistant. Ask me anything about fees, exams, or scholarships."
  },
  hi: {
    overview: "अवलोकन",
    scholarships: "छात्रवृत्ति",
    aiAssistant: "एआई सहायक",
    documents: "दस्तावेज़",
    helpCenter: "सहायता केंद्र",
    signOut: "साइन आउट",
    welcome: "वापस स्वागत है, छात्र",
    academicOverview: "आज के लिए आपका शैक्षणिक अवलोकन यहाँ है।",
    pendingFees: "बकाया शुल्क",
    attendance: "उपस्थिति",
    assignments: "सत्रीय कार्य",
    latestNotices: "नवीनतम सूचनाएं",
    noDues: "कोई बकाया नहीं",
    dueThisWeek: "इस सप्ताह देय",
    fromLastWeek: "पिछले सप्ताह से",
    viewAll: "सभी देखें",
    chatTitle: "कैंपस एआई",
    chatStatus: "सक्रिय",
    chatPlaceholder: "कुछ भी पूछें...",
    thinking: "सोच रहा हूँ...",
    errorConnecting: "क्षमा करें, मुझे सर्वर से कनेक्ट करने में समस्या हो रही है। कृपया सुनिश्चित करें कि बैकएंड चल रहा है।",
    helloAssistant: "नमस्ते! मैं आपका एआई कैंपस सहायक हूँ। मुझसे फीस, परीक्षा या छात्रवृत्ति के बारे में कुछ भी पूछें।"
  },
  ta: {
    overview: "மேலோட்டம்",
    aiAssistant: "AI உதவியாளர்",
    documents: "ஆவணங்கள்",
    helpCenter: "உதவி மையம்",
    signOut: "வெளியேறு",
    welcome: "மீண்டும் வருக, மாணவர்",
    academicOverview: "இன்று உங்கள் கல்வி மேலோட்டம் இங்கே உள்ளது.",
    pendingFees: "நிலுவையில் உள்ள கட்டணம்",
    attendance: "வருகை",
    assignments: "ஒப்படைப்புகள்",
    latestNotices: "சமீபத்திய அறிவிப்புகள்",
    noDues: "நிலுவைத் தொகை இல்லை",
    dueThisWeek: "இந்த வாரம் சமர்ப்பிக்க வேண்டியவை",
    fromLastWeek: "கடந்த வாரத்திலிருந்து",
    viewAll: "அனைத்தையும் காண்க",
    chatTitle: "கேம்பஸ் AI",
    chatStatus: "செயலில் உள்ளது",
    chatPlaceholder: "எதையும் கேளுங்கள்...",
    thinking: "யோசிக்கிறேன்...",
    errorConnecting: "மன்னிக்கவும், சேவையகத்துடன் இணைப்பதில் எனக்கு சிக்கல் உள்ளது. பின்தளம் இயங்குவதை உறுதி செய்யவும்.",
    helloAssistant: "வணக்கம்! நான் உங்கள் AI கேம்பஸ் உதவியாளர். கட்டணம், தேர்வுகள் அல்லது உதவித்தொகை பற்றி எதையும் கேளுங்கள்."
  },
  te: {
    overview: "అవలోకనం",
    scholarships: "స్కాలర్‌షిప్‌లు",
    aiAssistant: "AI అసిస్టెంట్",
    documents: "పత్రాలు",
    helpCenter: "సహాయ కేంద్రం",
    signOut: "సైన్ అవుట్",
    welcome: "తిరిగి స్వాగతం, విద్యార్థి",
    academicOverview: "ఈరోజు మీ విద్యా సంబంధిత అవలోకనం ఇక్కడ ఉంది.",
    pendingFees: "పెండింగ్ ఫీజులు",
    attendance: "హాజరు",
    assignments: "అసైన్‌మెంట్‌లు",
    latestNotices: "తాజా నోటీసులు",
    noDues: "బకాయిలు లేవు",
    dueThisWeek: "ఈ వారం సమర్పించాలి",
    fromLastWeek: "గత వారం నుండి",
    viewAll: "అన్నీ చూడండి",
    chatTitle: "క్యాంపస్ AI",
    chatStatus: "క్రియాశీలంగా ఉంది",
    chatPlaceholder: "ఏదైనా అడగండి...",
    thinking: "ఆలోచిస్తున్నాను...",
    errorConnecting: "క్షమించండి, సర్వర్‌కు కనెక్ట్ చేయడంలో నాకు సమస్య ఉంది. దయచేసి బ్యాకెండ్ నడుస్తున్నట్లు నిర్ధారించుకోండి.",
    helloAssistant: "హలో! నేను మీ AI క్యాంపస్ అసిస్టెంట్‌ని. ఫీజులు, పరీక్షలు లేదా స్కాలర్‌షిప్‌ల గురించి ఏదైనా అడగండి."
  },
  ne: {
    overview: "अवलोकन",
    scholarships: "छात्रवृत्ति",
    aiAssistant: "एआई सहायक",
    documents: "कागजातहरू",
    helpCenter: "सहयोग केन्द्र",
    signOut: "साइन आउट",
    welcome: "पुनः स्वागत छ, विद्यार्थी",
    academicOverview: "आजको लागि तपाईंको शैक्षिक अवलोकन यहाँ छ।",
    pendingFees: "बाँकी शुल्क",
    attendance: "उपस्थिति",
    assignments: "असाइनमेन्टहरू",
    latestNotices: "पछिल्ला सूचनाहरू",
    noDues: "कुनै बाँकी छैन",
    dueThisWeek: "यस हप्ता बुझाउनुपर्ने",
    fromLastWeek: "गत हप्तादेखि",
    viewAll: "सबै हेर्नुहोस्",
    chatTitle: "क्याम्पस एआई",
    chatStatus: "सक्रिय",
    chatPlaceholder: "केही पनि सोध्नुहोस्...",
    thinking: "सोच्दैछ...",
    errorConnecting: "माफ गर्नुहोस्, सर्भरमा जडान गर्न समस्या भइरहेको छ। कृपया ब्याकइन्ड चलिरहेको निश्चित गर्नुहोस्।",
    helloAssistant: "नमस्ते! म तपाईंको एआई क्याम्पस सहायक हुँ। शुल्क, परीक्षा वा छात्रवृत्तिको बारेमा मलाई केही पनि सोध्नुहोस्।"
  },
  ar: {
    overview: "نظرة عامة",
    scholarships: "المنح الدراسية",
    aiAssistant: "مساعد الذكاء الاصطناعي",
    documents: "المستندات",
    helpCenter: "مركز المساعدة",
    signOut: "تسجيل الخروج",
    welcome: "مرحباً بعودتك، طالب",
    academicOverview: "إليك نظرتك العامة الأكاديمية لليوم.",
    pendingFees: "الرسوم المعلقة",
    attendance: "الحضور",
    assignments: "الواجبات",
    latestNotices: "أحدث الإشعارات",
    noDues: "لا توجد مستحقات",
    dueThisWeek: "مستحق هذا الأسبوع",
    fromLastWeek: "من الأسبوع الماضي",
    viewAll: "عرض الكل",
    chatTitle: "الذكاء الاصطناعي للحرم الجامعي",
    chatStatus: "نشط",
    chatPlaceholder: "اسأل أي شيء...",
    thinking: "جاري التفكير...",
    errorConnecting: "عذراً، أواجه مشكلة في الاتصال بالخادم. يرجى التأكد من تشغيل الخادم الخلفي.",
    helloAssistant: "مرحباً! أنا مساعد الحرم الجامعي بالذكاء الاصطناعي. اسألني عن الرسوم أو الامتحانات أو المنح الدراسية."
  },
  ml: {
    overview: "അവലോകനം",
    scholarships: "സ്കോളർഷിപ്പുകൾ",
    aiAssistant: "AI അസിസ്റ്റന്റ്",
    documents: "രേഖകൾ",
    helpCenter: "സഹായ കേന്ദ്രം",
    signOut: "സൈൻ ഔട്ട്",
    welcome: "വീണ്ടും സ്വാഗതം, വിദ്യാർത്ഥി",
    academicOverview: "ഇന്നത്തെ നിങ്ങളുടെ അക്കാദമിക് അവലോകനം ഇതാ.",
    pendingFees: "അടയ്ക്കാനുള്ള ഫീസ്",
    attendance: "ഹാജർ",
    assignments: "അസൈൻമെന്റുകൾ",
    latestNotices: "പുതിയ അറിയിപ്പുകൾ",
    noDues: "കുടിശ്ശികയില്ല",
    dueThisWeek: "ഈ ആഴ്ച സമർപ്പിക്കേണ്ടവ",
    fromLastWeek: "കഴിഞ്ഞ ആഴ്ചയിൽ നിന്ന്",
    viewAll: "എല്ലാം കാണുക",
    chatTitle: "ക്യാമ്പസ് AI",
    chatStatus: "സജീവം",
    chatPlaceholder: "എന്തും ചോദിക്കൂ...",
    thinking: "ചിന്തിക്കുന്നു...",
    errorConnecting: "ക്ഷമിക്കണം, സെർവറിലേക്ക് ബന്ധിപ്പിക്കുന്നതിൽ പ്രശ്നമുണ്ട്. ദയവായി ബാക്കെൻഡ് പ്രവർത്തിക്കുന്നുണ്ടെന്ന് ഉറപ്പാക്കുക.",
    helloAssistant: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ AI ക്യാമ്പസ് അസിസ്റ്റന്റാണ്. ഫീസ്, പരീക്ഷകൾ, സ്കോളർഷിപ്പുകൾ എന്നിവയെക്കുറിച്ച് എന്തും ചോദിക്കൂ."
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
      };
      
      const storedLang = localStorage.getItem("app_language");
      const transCookie = getCookie('googtrans');
      
      let lang = storedLang || 'en';
      if (transCookie) {
        const cLang = transCookie.split('/').pop();
        if (['en', 'hi', 'ta', 'te', 'ne', 'ar', 'ml'].includes(cLang)) {
          lang = cLang;
        }
      }

      if (['en', 'hi', 'ta', 'te', 'ne', 'ar', 'ml'].includes(lang)) {
        setLanguage(lang);
      }
    }
    setMounted(true);
  }, []);

  const changeLanguage = (langCode) => {
    if (!['en', 'hi', 'ta', 'te', 'ne', 'ar', 'ml'].includes(langCode)) return;
    setLanguage(langCode);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_language", langCode);
      
      const cookieVal = langCode === 'en' ? '' : `/en/${langCode}`;
      
      // Set cookie on root path cleanly without invalid domain attribute so Chrome/Edge persist it
      const date = new Date();
      date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
      const expires = "; expires=" + date.toUTCString();
      
      document.cookie = "googtrans=" + cookieVal + expires + "; path=/;";
      document.cookie = "googtrans=" + cookieVal + "; path=/;";

      window.location.reload();
    }
  };

  const t = (key) => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    return translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {mounted && <div id="google_translate_element" style={{ display: 'none' }} />}
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
