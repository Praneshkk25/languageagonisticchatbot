"use client";

import { useState } from "react";
import { useLanguage } from "../../LanguageContext";

export default function HelpPage() {
    const { language } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [expandedId, setExpandedId] = useState(null);

    const categories = [
        { id: "all", label: language === "hi" ? "सभी" : "All Categories" },
        { id: "scholarship", label: language === "hi" ? "छात्रवृत्ति" : "Scholarships" },
        { id: "academic", label: language === "hi" ? "अकादमिक" : "Academics" },
        { id: "finance", label: language === "hi" ? "वित्तीय" : "Fees & Finance" }
    ];

    const faqs = [
        {
            id: 1,
            category: "scholarship",
            question: "How do I check my scholarship eligibility?",
            answer: "You can ask the Campus AI Assistant in the chat box: 'Am I eligible for scholarships?'. The AI chatbot will evaluate your GPA, department, academic year, and family income details from the database and tell you your eligibility instantly."
        },
        {
            id: 2,
            category: "scholarship",
            question: "Where should I upload my scholarship documents?",
            answer: "You can upload all relevant scholarship certificates and income declarations via the 'Digital Vault / Documents' page in your Student Dashboard. Once uploaded, admins can review and approve them."
        },
        {
            id: 3,
            category: "academic",
            question: "Where can I find my semester exam timetable?",
            answer: "Exam schedules are published under the Academics section of the student portal. Alternatively, you can ask the chatbot 'Show my exam schedule' or 'Timetable' to view it directly."
        },
        {
            id: 4,
            category: "finance",
            question: "How do I pay my semester fees online?",
            answer: "You can navigate to the 'Fees & Payments' section on the portal dashboard. Select your current semester fee invoice, click 'Pay Now', and complete the secure payment. Receipts are generated instantly."
        },
        {
            id: 5,
            category: "finance",
            question: "Who do I contact for fee discrepancies?",
            answer: "For any billing errors or payment discrepancies, please submit an inquiry ticket under the 'Finance Support' tab or email the college accounts division at support@college.edu."
        }
    ];

    const toggleExpand = (id) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    const filteredFaqs = faqs.filter(faq => {
        const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
        const matchesQuery = !searchQuery || 
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesQuery;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge" style={{ marginBottom: '12px' }}>? Help & Support Hub</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    How can we help you today?
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '750px', marginBottom: '16px' }}>
                    Browse frequently asked questions regarding scholarships, academic calendars, fee payments, and document verification.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`button ${activeCategory === cat.id ? 'primary' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* SEARCH TOOLBAR */}
            <div className="toolbar">
                <div className="search toolbar-search">
                    <span className="search-icon">⌕</span>
                    <input
                        type="text"
                        placeholder="Search help topics or questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* FAQS LIST PANEL */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Frequently Asked Questions ({filteredFaqs.length})</div>
                        <div className="panel-subtitle">Click any question to view full answer and details</div>
                    </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredFaqs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">?</div>
                            <div className="empty-title">No matching help topics found</div>
                            <div className="empty-description">Try searching for a different keyword or ask Campus AI directly!</div>
                        </div>
                    ) : (
                        filteredFaqs.map((faq) => {
                            const isExpanded = expandedId === faq.id;
                            return (
                                <div key={faq.id} className="data-row" onClick={() => toggleExpand(faq.id)} style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div className="data-icon">?</div>
                                            <div className="data-title" style={{ fontSize: '15px' }}>{faq.question}</div>
                                        </div>
                                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
                                    </div>

                                    {isExpanded && (
                                        <div style={{ padding: '12px 14px', borderRadius: '8px', background: '#081229', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '4px', width: '100%' }}>
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* FOOTER DISCLAIMER */}
            <div className="disclaimer">
                🛡️ Can't find what you're looking for? Ask Campus AI in the AI Assistant tab anytime!
            </div>
        </div>
    );
}
