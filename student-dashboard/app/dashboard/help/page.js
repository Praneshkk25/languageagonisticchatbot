"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronUp, HelpCircle, GraduationCap, DollarSign, Calendar, BookOpen } from "lucide-react";
import { useLanguage } from "../../LanguageContext";

export default function HelpPage() {
    const { language, t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [expandedId, setExpandedId] = useState(null);

    const categories = [
        { id: "all", label: language === "hi" ? "सभी" : "All Categories", icon: HelpCircle },
        { id: "scholarship", label: language === "hi" ? "छात्रवृत्ति" : "Scholarships", icon: GraduationCap },
        { id: "academic", label: language === "hi" ? "अकादमिक" : "Academics", icon: BookOpen },
        { id: "finance", label: language === "hi" ? "वित्तीय" : "Fees & Finance", icon: DollarSign }
    ];

    const faqs = [
        {
            id: 1,
            category: "scholarship",
            question: language === "hi" ? "मैं छात्रवृत्ति पात्रता की जांच कैसे करूं?" : "How do I check my scholarship eligibility?",
            answer: language === "hi" 
                ? "आप मुख्य चैट सहायक पर जाकर पूछ सकते हैं 'क्या मैं छात्रवृत्ति के लिए पात्र हूँ?'। हमारा AI सहायक आपकी शैक्षिक और पारिवारिक आय विवरणों का मूल्यांकन करेगा और आपको तत्काल निर्णय बताएगा।"
                : "You can ask the Sona AI Assistant in the chat box: 'Am I eligible for scholarships?'. The AI chatbot will evaluate your GPA, department, academic year, and family income details from the database and tell you your eligibility instantly."
        },
        {
            id: 2,
            category: "scholarship",
            question: language === "hi" ? "मुझे आवश्यक छात्रवृत्ति विवरण अपलोड कहाँ करने चाहिए?" : "Where should I upload my scholarship documents?",
            answer: language === "hi"
                ? "छात्रवृत्ति दस्तावेज और आवेदन पत्र छात्र पोर्टल के दस्तावेज़ अनुभाग के माध्यम से अपलोड किए जा सकते हैं। एक बार अपलोड होने के बाद, प्रशासक इसकी समीक्षा और अनुमोदन करेंगे।"
                : "You can upload all relevant scholarship certificates and income declarations via the 'Documents' page in your Student Dashboard. Once uploaded, admins can review and approve them."
        },
        {
            id: 3,
            category: "academic",
            question: language === "hi" ? "मैं अपनी परीक्षा समय सारणी कहाँ पा सकता हूँ?" : "Where can I find my semester exam timetable?",
            answer: language === "hi"
                ? "परीक्षा समय सारणी अकादमिक पोर्टल या सीधे हमारे AI सहायक से पूछकर प्राप्त की जा सकती है। बस पूछें 'मेरी परीक्षा समय सारणी दिखाएं'।"
                : "Exam schedules are published under the Academics section of the student portal. Alternatively, you can ask the chatbot 'Show my exam schedule' or 'Timetable' to view it directly."
        },
        {
            id: 4,
            category: "finance",
            question: language === "hi" ? "मैं अपनी सेमेस्टर फीस का भुगतान ऑनलाइन कैसे करूँ?" : "How do I pay my semester fees online?",
            answer: language === "hi"
                ? "फीस का भुगतान ऑनलाइन पेमेंट गेटवे के माध्यम से किया जा सकता है जो 'फीस' टैब के तहत उपलब्ध है। भुगतान के तुरंत बाद रसीदें डाउनलोड के लिए उपलब्ध हो जाएंगी।"
                : "You can navigate to the 'Fees & Payments' section on the portal dashboard. Select your current semester fee invoice, click 'Pay Now', and complete the secure payment. Receipts are generated instantly."
        },
        {
            id: 5,
            category: "finance",
            question: language === "hi" ? "अगर मेरी फीस में कोई विसंगति हो तो किससे संपर्क करें?" : "Who do I contact for fee discrepancies?",
            answer: language === "hi"
                ? "किसी भी विसंगति के मामले में, कृपया कॉलेज के वित्त कार्यालय से संपर्क करें या support@sonacollege.edu पर टिकट दर्ज करें।"
                : "For any billing errors or payment discrepancies, please submit an inquiry ticket under the 'Finance Support' tab or email the college accounts division at support@sonacollege.edu."
        },
        {
            id: 6,
            category: "academic",
            question: language === "hi" ? "क्या मैं तमिल या तेलुगु में चैट कर सकता हूँ?" : "Can I chat with the AI chatbot in Tamil or Telugu?",
            answer: language === "hi"
                ? "हाँ! हमारा AI सहायक पूरी तरह से बहुभाषी है। आप चैट विंडो के शीर्ष पर स्थित भाषा चयनकर्ता मेनू से हिंदी, तमिल, तेलुगु, या अंग्रेजी चुन सकते हैं।"
                : "Yes! The chatbot fully supports English, Hindi, Tamil, and Telugu. You can switch the active conversation language using the select dropdown at the top right of the Chat screen."
        }
    ];

    const filteredFaqs = faqs.filter(faq => {
        const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header Title */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-800" style={{ fontWeight: 800 }}>
                    {language === "hi" ? "सहायता केंद्र" : "Help & FAQ Center"}
                </h1>
                <p className="text-slate-500 text-sm font-semibold">
                    {language === "hi" ? "अपने प्रश्नों के त्वरित उत्तर ढूंढें या नीचे दिए गए विषयों को ब्राउज़ करें।" : "Find instant answers to your questions or browse topics below."}
                </p>
            </div>

            {/* Search Bar Container */}
            <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none">
                    <Search className="w-5 h-5" />
                </div>
                <input 
                    type="text"
                    placeholder={language === "hi" ? "प्रश्नों या उत्तरों को खोजें..." : "Search FAQs, scholarships, exam tables..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-14 pr-6 rounded-2xl bg-white/80 border border-slate-100 hover:border-slate-200/80 focus:border-primary outline-none text-sm font-bold text-slate-700 shadow-md shadow-slate-100/50 transition-all placeholder:text-slate-400 focus:bg-white"
                />
            </div>

            {/* Category Navigation Pills */}
            <div className="flex flex-wrap gap-2.5">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setActiveCategory(cat.id);
                                setExpandedId(null);
                            }}
                            className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
                                activeCategory === cat.id
                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/25"
                                : "bg-white/70 border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-800"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{cat.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* FAQ Accordions List */}
            <div className="space-y-3.5">
                <AnimatePresence mode="popLayout">
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq) => {
                            const isExpanded = expandedId === faq.id;
                            return (
                                <motion.div
                                    key={faq.id}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="glass rounded-2xl border border-white/75 bg-white/70 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <button
                                        onClick={() => toggleExpand(faq.id)}
                                        className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 font-bold text-slate-800 hover:text-primary transition-colors text-sm md:text-base"
                                    >
                                        <span>{faq.question}</span>
                                        <div className="shrink-0 text-slate-400">
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="border-t border-slate-100/50 bg-slate-50/20"
                                            >
                                                <div className="px-6 py-5 text-sm leading-relaxed text-slate-600 font-semibold">
                                                    {faq.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 bg-white/40 rounded-2xl border border-dashed border-slate-200"
                        >
                            <p className="text-slate-400 font-bold text-sm">
                                {language === "hi" ? "कोई मिलान वाले प्रश्न नहीं मिले।" : "No matching FAQs found. Try searching for other keywords!"}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
