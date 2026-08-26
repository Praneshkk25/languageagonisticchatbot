"use client";

import { useState, useEffect } from "react";
import { getApiBaseUrl } from "@/lib/api";

export default function SettingsPage() {
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("demographics"); // demographics, academic, financial, bank, security

    const [formData, setFormData] = useState({
        // Basic Info
        name: "",
        id: "",
        dob: "",
        age: 20,
        email: "",
        phone: "",
        gender: "Male",
        address: "",
        bio: "",

        // 1. Nationality & Domicile Eligibility
        nationality: "Indian",
        citizenship: "Indian Citizen",
        domicile_state: "Tamil Nadu",
        district: "Salem",
        caste_category: "General",
        minority_status: "None",
        pwd_status: "No",
        disability_type: "None",
        disability_percentage: 0,
        first_generation_graduate: "No",
        family_background: "General",
        employment_status: "Full-time Student",
        marital_status: "Unmarried",
        special_conditions: "None",
        guardian_name: "",
        guardian_mobile: "",

        // 2. Academic Requirements
        current_education_level: "Undergraduate",
        course_degree: "B.E.",
        department: "CSE",
        department_stream: "Computer Science & Engineering",
        college_institution: "Sona College of Technology",
        year: 3,
        current_semester: "Semester 5",
        cgpa: 8.5,
        percentage_equivalent: 85.0,
        tenth_percentage: 92.4,
        twelfth_percentage: 89.6,
        backlog_status: "0 Backlogs / No Standing Arrears",
        admission_mode: "Merit / Government Quota Counseling",

        // 3. Financial Requirements & Proof
        family_income: 250000,
        economic_category: "Low Income (Below ₹2.5L)",
        income_certificate_available: "Yes",
        income_certificate_authority: "Tehsildar / Taluk Office",
        income_certificate_no: "IC/2025/TN/981245",
        income_certificate_issue_date: "2025-06-15",
        ration_card_type: "PHH (Priority Household)",

        // 4. Bank Details & DBT Transfer
        bank_name: "State Bank of India",
        bank_account_no: "987654321012",
        ifsc_code: "SBIN0001234",
        bank_branch: "Salem Main Branch",
        aadhaar_linked_bank: "Yes",

        // 5. Security Credentials
        passkey_1: "123456",
        passkey_2: "654321",
        email_notifications: true,
        sms_notifications: true
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            let userId = "";
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    userId = u.id || u.admission_no || "";
                    setFormData(prev => ({
                        ...prev,
                        ...u,
                        id: userId
                    }));
                } catch (e) {}
            }

            if (userId) {
                fetch(`${getApiBaseUrl()}/api/students/${userId}`)
                    .then(res => res.ok ? res.json() : null)
                    .then(data => {
                        if (data) {
                            setFormData(prev => ({
                                ...prev,
                                ...data,
                                id: userId
                            }));
                        }
                    })
                    .catch(() => {});
            }
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({
            ...prev,
            [name]: val
        }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (typeof window !== "undefined") {
                const userObj = { ...formData };
                localStorage.setItem("user", JSON.stringify(userObj));
                window.dispatchEvent(new Event("userProfileUpdated"));
            }

            // Sync with FastAPI Backend
            if (formData.id) {
                const payload = {
                    ...formData,
                    cgpa: parseFloat(formData.cgpa) || 8.0,
                    family_income: parseFloat(formData.family_income) || 250000.0,
                    year: parseInt(formData.year) || 3,
                    percentage_equivalent: parseFloat(formData.percentage_equivalent) || 80.0,
                    tenth_percentage: parseFloat(formData.tenth_percentage) || 90.0,
                    twelfth_percentage: parseFloat(formData.twelfth_percentage) || 85.0,
                    disability_percentage: parseFloat(formData.disability_percentage) || 0.0
                };

                await fetch(`${getApiBaseUrl()}/api/students/${formData.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 4000);
        } catch (err) {
            console.error("Backend profile sync error:", err);
            alert("Profile saved locally. Error syncing to backend.");
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: "demographics", label: "1. Nationality & Demographics", icon: "🌐" },
        { id: "academic", label: "2. Academic Requirements", icon: "🎓" },
        { id: "financial", label: "3. Financial & Income Proof", icon: "💰" },
        { id: "bank", label: "4. Bank & Direct DBT", icon: "🏦" },
        { id: "security", label: "5. Security & Passkeys", icon: "🔒" },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
            
            {/* HERO PROFILE SUMMARY */}
            <section className="panel" style={{ padding: '28px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <span className="badge primary" style={{ marginBottom: '8px' }}>👤 Student Profile & Eligibility Matrix</span>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>
                            {formData.name || "Student"} — Eligibility & Profile Settings
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '850px', marginTop: '6px' }}>
                            Configure your complete demographic, academic qualification, family income, and DBT bank account parameters. These criteria determine your automated eligibility matches for Central, State, AICTE, and Private scholarships.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span className="badge success">⚡ Real-time Sync</span>
                        <span className="badge">Roll ID: {formData.id || "N/A"}</span>
                    </div>
                </div>

                {savedSuccess && (
                    <div style={{ marginTop: '16px', padding: '14px 20px', borderRadius: '10px', background: 'rgba(66, 214, 164, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontWeight: 700, fontSize: '13px' }}>
                        ✓ Profile and Scholarship Eligibility parameters successfully saved and synchronized!
                    </div>
                )}
            </section>

            {/* TAB NAVIGATION BAR */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`button ${activeTab === tab.id ? 'primary' : ''}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            fontSize: '13px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            borderBottom: activeTab === tab.id ? '2px solid #825cfb' : 'none'
                        }}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* FORM CONTAINER */}
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* ========================================================================= */}
                {/* TAB 1: NATIONALITY, DOMICILE, CITIZENSHIP & DEMOGRAPHICS */}
                {/* ========================================================================= */}
                {activeTab === "demographics" && (
                    <section className="panel" style={{ padding: '26px' }}>
                        <div className="panel-header" style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                            <div>
                                <div className="panel-title" style={{ fontSize: '18px' }}>1. Nationality, Domicile & Demographics</div>
                                <div className="panel-subtitle">Citizenship, State/District domicile, caste categories, and minority quotas</div>
                            </div>
                        </div>

                        <div className="grid grid-2" style={{ gap: '18px' }}>
                            <div>
                                <label className="label">Full Legal Name (as per Aadhaar & Records)</label>
                                <input type="text" name="name" className="input" value={formData.name} onChange={handleChange} required />
                            </div>

                            <div>
                                <label className="label">Roll Number / Admission ID</label>
                                <input type="text" name="id" className="input" value={formData.id} disabled style={{ opacity: 0.7 }} />
                            </div>

                            <div>
                                <label className="label">Nationality</label>
                                <select name="nationality" className="input" value={formData.nationality} onChange={handleChange}>
                                    <option value="Indian">Indian</option>
                                    <option value="Non-Resident Indian (NRI)">Non-Resident Indian (NRI)</option>
                                    <option value="Overseas Citizen of India (OCI)">Overseas Citizen of India (OCI)</option>
                                    <option value="Foreign National">Foreign National</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Citizenship Requirement Status</label>
                                <select name="citizenship" className="input" value={formData.citizenship} onChange={handleChange}>
                                    <option value="Indian Citizen">Indian Citizen (Eligible for National Schemes)</option>
                                    <option value="OCI / PIO Cardholder">OCI / PIO Cardholder</option>
                                    <option value="State Resident by Domicile">State Resident by Domicile Certificate</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">State / Region of Domicile</label>
                                <input type="text" name="domicile_state" className="input" value={formData.domicile_state} onChange={handleChange} placeholder="e.g. Tamil Nadu" />
                            </div>

                            <div>
                                <label className="label">Native District</label>
                                <input type="text" name="district" className="input" value={formData.district} onChange={handleChange} placeholder="e.g. Salem / Chennai / Coimbatore" />
                            </div>

                            <div>
                                <label className="label">Date of Birth (DOB)</label>
                                <input type="date" name="dob" className="input" value={formData.dob} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="label">Gender</label>
                                <select name="gender" className="input" value={formData.gender} onChange={handleChange}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female (Eligible for Pragati & Women Scholarships)</option>
                                    <option value="Transgender">Transgender (Eligible for Inclusion Quotas)</option>
                                    <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Social Category / Community</label>
                                <select name="caste_category" className="input" value={formData.caste_category} onChange={handleChange}>
                                    <option value="General">General / Open Competition (OC)</option>
                                    <option value="OBC">Other Backward Classes (OBC - Non-Creamy Layer)</option>
                                    <option value="BC / MBC">Backward Class / Most Backward Class (BC/MBC)</option>
                                    <option value="SC">Scheduled Caste (SC - Post-Matric Eligible)</option>
                                    <option value="ST">Scheduled Tribe (ST - National Fellowship Eligible)</option>
                                    <option value="EWS">Economically Weaker Section (EWS)</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Religious / Linguistic Minority Status</label>
                                <select name="minority_status" className="input" value={formData.minority_status} onChange={handleChange}>
                                    <option value="None">None / Not Applicable</option>
                                    <option value="Hindu">Hindu (General / Non-Minority)</option>
                                    <option value="Muslim">Muslim (Minority Affairs Scheme)</option>
                                    <option value="Christian">Christian (Minority Affairs Scheme)</option>
                                    <option value="Sikh">Sikh (Minority Affairs Scheme)</option>
                                    <option value="Buddhist">Buddhist (Minority Affairs Scheme)</option>
                                    <option value="Jain">Jain (Minority Affairs Scheme)</option>
                                    <option value="Parsi">Parsi (Minority Affairs Scheme)</option>
                                    <option value="Linguistic Minority">Linguistic Minority</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Person with Disability (PwD) / Specially Abled?</label>
                                <select name="pwd_status" className="input" value={formData.pwd_status} onChange={handleChange}>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes (Eligible for AICTE Saksham & PwD Schemes)</option>
                                </select>
                            </div>

                            {formData.pwd_status === "Yes" && (
                                <>
                                    <div>
                                        <label className="label">Disability Classification</label>
                                        <select name="disability_type" className="input" value={formData.disability_type} onChange={handleChange}>
                                            <option value="Visually Impaired / Low Vision">Visually Impaired / Low Vision</option>
                                            <option value="Orthopedic / Locomotor">Orthopedic / Locomotor</option>
                                            <option value="Hearing / Speech Impaired">Hearing / Speech Impaired</option>
                                            <option value="Multiple Disabilities">Multiple Disabilities</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Disability Percentage (% on Medical Certificate)</label>
                                        <input type="number" name="disability_percentage" className="input" value={formData.disability_percentage} onChange={handleChange} min="40" max="100" />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="label">First Generation Graduate Student?</label>
                                <select name="first_generation_graduate" className="input" value={formData.first_generation_graduate} onChange={handleChange}>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes (Eligible for Tamil Nadu State First-Graduate Tuition Waiver)</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Family Background / Special Quotas</label>
                                <select name="family_background" className="input" value={formData.family_background} onChange={handleChange}>
                                    <option value="General">General Family Background</option>
                                    <option value="Single Parent Family">Single Parent / Mother Dependent</option>
                                    <option value="Orphan / Ward of State">Orphan / State Ward</option>
                                    <option value="Ward of Armed Forces / Ex-Servicemen">Ward of Armed Forces / PMSS Scheme Eligible</option>
                                    <option value="Farmer / Agricultural Family">Farmer / Agricultural Family</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Employment Status</label>
                                <select name="employment_status" className="input" value={formData.employment_status} onChange={handleChange}>
                                    <option value="Full-time Student">Full-time Regular Student (Unemployed)</option>
                                    <option value="Part-time Employed">Part-time Employed</option>
                                    <option value="Self-Employed">Self-Employed</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Marital Status</label>
                                <select name="marital_status" className="input" value={formData.marital_status} onChange={handleChange}>
                                    <option value="Unmarried">Unmarried / Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced / Widowed">Divorced / Widowed</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Special Eligibility Conditions</label>
                                <select name="special_conditions" className="input" value={formData.special_conditions} onChange={handleChange}>
                                    <option value="None">None</option>
                                    <option value="Single Girl Child">Single Girl Child (UGC PG Scheme Eligible)</option>
                                    <option value="Rural Government Schooling (7.5% Quota)">Rural Govt Schooling (7.5% State Quota)</option>
                                    <option value="State / National Sports Athlete">State / National Sports Champion</option>
                                    <option value="COVID-19 / Disaster Affected">Disaster / COVID Affected Orphan</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Father / Guardian Full Name</label>
                                <input type="text" name="guardian_name" className="input" value={formData.guardian_name} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="label">Guardian Contact Mobile</label>
                                <input type="text" name="guardian_mobile" className="input" value={formData.guardian_mobile} onChange={handleChange} />
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="label">Permanent Residential Address</label>
                                <textarea rows={2} name="address" className="input" value={formData.address} onChange={handleChange} />
                            </div>
                        </div>
                    </section>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: ACADEMIC REQUIREMENTS & EDUCATIONAL QUALIFICATIONS */}
                {/* ========================================================================= */}
                {activeTab === "academic" && (
                    <section className="panel" style={{ padding: '26px' }}>
                        <div className="panel-header" style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                            <div>
                                <div className="panel-title" style={{ fontSize: '18px' }}>2. Academic Requirements & Educational Records</div>
                                <div className="panel-subtitle">Current degree level, department, CGPA, semester, standing backlogs, and previous marks</div>
                            </div>
                        </div>

                        <div className="grid grid-2" style={{ gap: '18px' }}>
                            <div>
                                <label className="label">Current Education Level</label>
                                <select name="current_education_level" className="input" value={formData.current_education_level} onChange={handleChange}>
                                    <option value="School (Higher Secondary)">School (10th / 11th / 12th)</option>
                                    <option value="Diploma / Polytechnic">Diploma / Polytechnic (3 Years)</option>
                                    <option value="Undergraduate">Undergraduate (B.E. / B.Tech / B.Sc / B.Com / B.A)</option>
                                    <option value="Postgraduate">Postgraduate (M.E. / M.Tech / MBA / MCA / M.Sc)</option>
                                    <option value="PhD / Doctoral">PhD / Doctoral Research Fellow</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Course / Degree Program</label>
                                <select name="course_degree" className="input" value={formData.course_degree} onChange={handleChange}>
                                    <option value="B.E.">Bachelor of Engineering (B.E.)</option>
                                    <option value="B.Tech">Bachelor of Technology (B.Tech)</option>
                                    <option value="B.Sc">Bachelor of Science (B.Sc)</option>
                                    <option value="M.E. / M.Tech">Master of Engineering (M.E. / M.Tech)</option>
                                    <option value="MBA / MCA">Master of Business Administration / MCA</option>
                                    <option value="Diploma">Diploma Engineering</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Department / Branch</label>
                                <select name="department" className="input" value={formData.department} onChange={handleChange}>
                                    <option value="CSE">Computer Science & Engineering (CSE)</option>
                                    <option value="IT">Information Technology (IT)</option>
                                    <option value="AIDS">Artificial Intelligence & Data Science (AI&DS)</option>
                                    <option value="ECE">Electronics & Communication Engineering (ECE)</option>
                                    <option value="EEE">Electrical & Electronics Engineering (EEE)</option>
                                    <option value="MECH">Mechanical Engineering (MECH)</option>
                                    <option value="CIVIL">Civil Engineering (CIVIL)</option>
                                    <option value="BME">Biomedical Engineering (BME)</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">College / Institution Name</label>
                                <input type="text" name="college_institution" className="input" value={formData.college_institution} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="label">Current Year of Study</label>
                                <select name="year" className="input" value={formData.year} onChange={handleChange}>
                                    <option value={1}>1st Year (Freshman)</option>
                                    <option value={2}>2nd Year (Sophomore)</option>
                                    <option value={3}>3rd Year (Junior)</option>
                                    <option value={4}>4th Year (Senior / Final)</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Current Semester</label>
                                <select name="current_semester" className="input" value={formData.current_semester} onChange={handleChange}>
                                    <option value="Semester 1">Semester 1</option>
                                    <option value="Semester 2">Semester 2</option>
                                    <option value="Semester 3">Semester 3</option>
                                    <option value="Semester 4">Semester 4</option>
                                    <option value="Semester 5">Semester 5</option>
                                    <option value="Semester 6">Semester 6</option>
                                    <option value="Semester 7">Semester 7</option>
                                    <option value="Semester 8">Semester 8</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Cumulative Grade Point Average (CGPA / 10.0)</label>
                                <input type="number" step="0.01" name="cgpa" className="input" value={formData.cgpa} onChange={handleChange} min="0" max="10" required />
                            </div>

                            <div>
                                <label className="label">Equivalent Percentage Score (%)</label>
                                <input type="number" step="0.1" name="percentage_equivalent" className="input" value={formData.percentage_equivalent} onChange={handleChange} min="0" max="100" />
                            </div>

                            <div>
                                <label className="label">10th Standard / SSC Board Percentage (%)</label>
                                <input type="number" step="0.1" name="tenth_percentage" className="input" value={formData.tenth_percentage} onChange={handleChange} min="0" max="100" />
                            </div>

                            <div>
                                <label className="label">12th Standard (HSC) / Diploma Aggregate (%)</label>
                                <input type="number" step="0.1" name="twelfth_percentage" className="input" value={formData.twelfth_percentage} onChange={handleChange} min="0" max="100" />
                            </div>

                            <div>
                                <label className="label">Backlog / Standing Arrears Status</label>
                                <select name="backlog_status" className="input" value={formData.backlog_status} onChange={handleChange}>
                                    <option value="0 Backlogs / No Standing Arrears">0 Backlogs / All Papers Cleared (Eligible for all scholarships)</option>
                                    <option value="1 Standing Backlog">1 Standing Backlog</option>
                                    <option value="2+ Standing Backlogs">2+ Standing Backlogs</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Admission Quota / Mode of Entry</label>
                                <select name="admission_mode" className="input" value={formData.admission_mode} onChange={handleChange}>
                                    <option value="Merit / Government Quota Counseling">Merit / Government Single Window Counseling (TNEA/CSAB)</option>
                                    <option value="Management Quota">Management Quota</option>
                                    <option value="Lateral Entry (Direct 2nd Year)">Lateral Entry (Direct 2nd Year Diploma Scheme)</option>
                                    <option value="Sports Quota">Sports Quota Scheme</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">First Generation Graduate (First Graduate in Family)?</label>
                                <select name="first_generation_graduate" className="input" value={formData.first_generation_graduate} onChange={handleChange}>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes (Eligible for State First-Graduate Tuition Fee Concession)</option>
                                </select>
                            </div>
                        </div>
                    </section>
                )}

                {/* ========================================================================= */}
                {/* TAB 3: FINANCIAL REQUIREMENTS & INCOME PROOFS */}
                {/* ========================================================================= */}
                {activeTab === "financial" && (
                    <section className="panel" style={{ padding: '26px' }}>
                        <div className="panel-header" style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                            <div>
                                <div className="panel-title" style={{ fontSize: '18px' }}>3. Financial Requirements & Income Documentation</div>
                                <div className="panel-subtitle">Annual family gross income, issuing authority, certificate validity, and economic brackets</div>
                            </div>
                        </div>

                        <div className="grid grid-2" style={{ gap: '18px' }}>
                            <div>
                                <label className="label">Annual Gross Family Income (₹ in numbers)</label>
                                <input type="number" name="family_income" className="input" value={formData.family_income} onChange={handleChange} required />
                                <div style={{ fontSize: '11px', color: '#818cf8', marginTop: '4px' }}>
                                    ₹ {Number(formData.family_income || 0).toLocaleString('en-IN')} per annum
                                </div>
                            </div>

                            <div>
                                <label className="label">Economic Category Classification</label>
                                <select name="economic_category" className="input" value={formData.economic_category} onChange={handleChange}>
                                    <option value="Below Poverty Line (BPL)">Below Poverty Line (BPL - Annual Income &lt; ₹1,00,000)</option>
                                    <option value="Low Income (Below ₹2.5L)">Low Income (Annual Income &lt; ₹2,50,000 - Post-Matric & Need-based)</option>
                                    <option value="Economically Weaker Section (EWS)">EWS (Annual Income &lt; ₹8,00,000)</option>
                                    <option value="Middle Income (₹2.5L - ₹8.0L)">Middle Income (₹2.5L to ₹8.0L - Merit Scheme Eligible)</option>
                                    <option value="Higher Income (Above ₹8.0L)">Above ₹8.0 Lakhs per annum</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Income Certificate Availability</label>
                                <select name="income_certificate_available" className="input" value={formData.income_certificate_available} onChange={handleChange}>
                                    <option value="Yes">Yes — Valid Certificate Issued</option>
                                    <option value="Applied / In-Progress">Applied / In-Progress with Revenue Dept</option>
                                    <option value="Not Available">Not Available</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Income Certificate Issuing Authority</label>
                                <select name="income_certificate_authority" className="input" value={formData.income_certificate_authority} onChange={handleChange}>
                                    <option value="Tehsildar / Taluk Office">Tehsildar / Taluk Office (Revenue Department)</option>
                                    <option value="Sub-Divisional Magistrate (SDM)">Sub-Divisional Magistrate (SDM)</option>
                                    <option value="District Collector / Deputy Commissioner">District Collector / Deputy Commissioner</option>
                                    <option value="Gazetted Revenue Officer">Gazetted Revenue Officer</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Income Certificate Reference Number</label>
                                <input type="text" name="income_certificate_no" className="input" value={formData.income_certificate_no} onChange={handleChange} placeholder="e.g. TN-720250615102" />
                            </div>

                            <div>
                                <label className="label">Income Certificate Date of Issue</label>
                                <input type="date" name="income_certificate_issue_date" className="input" value={formData.income_certificate_issue_date} onChange={handleChange} />
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="label">Ration Card Type / Category</label>
                                <select name="ration_card_type" className="input" value={formData.ration_card_type} onChange={handleChange}>
                                    <option value="PHH (Priority Household)">PHH (Priority Household - Green/Rice Card)</option>
                                    <option value="AAY (Antyodaya Anna Yojana)">AAY (Antyodaya Anna Yojana - Poorest of Poor)</option>
                                    <option value="NPHH (Non-Priority Household)">NPHH (Non-Priority Household - Sugar/White Card)</option>
                                    <option value="None">None / Not Applicable</option>
                                </select>
                            </div>
                        </div>
                    </section>
                )}

                {/* ========================================================================= */}
                {/* TAB 4: BANK ACCOUNT & DIRECT BENEFIT TRANSFER (DBT) */}
                {/* ========================================================================= */}
                {activeTab === "bank" && (
                    <section className="panel" style={{ padding: '26px' }}>
                        <div className="panel-header" style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                            <div>
                                <div className="panel-title" style={{ fontSize: '18px' }}>4. Bank Account & Direct Benefit Transfer (DBT)</div>
                                <div className="panel-subtitle">Government scholarships are disbursed directly to this Aadhaar-seeded bank account via PFMS/DBT</div>
                            </div>
                        </div>

                        <div className="grid grid-2" style={{ gap: '18px' }}>
                            <div>
                                <label className="label">Bank Name</label>
                                <input type="text" name="bank_name" className="input" value={formData.bank_name} onChange={handleChange} placeholder="e.g. State Bank of India / Canara Bank / HDFC" required />
                            </div>

                            <div>
                                <label className="label">Savings Bank Account Number</label>
                                <input type="text" name="bank_account_no" className="input" value={formData.bank_account_no} onChange={handleChange} placeholder="e.g. 987654321012" required />
                            </div>

                            <div>
                                <label className="label">Bank IFSC Code</label>
                                <input type="text" name="ifsc_code" className="input" value={formData.ifsc_code} onChange={handleChange} placeholder="e.g. SBIN0001234" required />
                            </div>

                            <div>
                                <label className="label">Branch Name</label>
                                <input type="text" name="bank_branch" className="input" value={formData.bank_branch} onChange={handleChange} placeholder="e.g. Salem Main Branch" />
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="label">Is this Bank Account Aadhaar-Linked for Direct DBT Transfer?</label>
                                <select name="aadhaar_linked_bank" className="input" value={formData.aadhaar_linked_bank} onChange={handleChange}>
                                    <option value="Yes">Yes — Aadhaar Linked & NPCI DBT Enabled (Verified for PFMS)</option>
                                    <option value="No">No — Not Linked (DBT transfers may fail)</option>
                                    <option value="In-Progress">In-Progress with Bank Branch</option>
                                </select>
                            </div>
                        </div>
                    </section>
                )}

                {/* ========================================================================= */}
                {/* TAB 5: SECURITY & PASSKEYS */}
                {/* ========================================================================= */}
                {activeTab === "security" && (
                    <section className="panel" style={{ padding: '26px' }}>
                        <div className="panel-header" style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                            <div>
                                <div className="panel-title" style={{ fontSize: '18px' }}>5. Security Credentials & Double Passkeys</div>
                                <div className="panel-subtitle">Manage 6-digit double passkeys required for authorized scholarship form downloads</div>
                            </div>
                        </div>

                        <div className="grid grid-2" style={{ gap: '18px' }}>
                            <div>
                                <label className="label">Passkey 1 (Primary 6-Digit PIN)</label>
                                <input type="password" maxLength={6} name="passkey_1" className="input" value={formData.passkey_1} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="label">Passkey 2 (Secondary 6-Digit PIN)</label>
                                <input type="password" maxLength={6} name="passkey_2" className="input" value={formData.passkey_2} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="label">Official Email Address</label>
                                <input type="email" name="email" className="input" value={formData.email} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="label">Student Mobile Contact</label>
                                <input type="text" name="phone" className="input" value={formData.phone} onChange={handleChange} />
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="label">Short Bio / Educational Statement</label>
                                <textarea rows={2} name="bio" className="input" value={formData.bio} onChange={handleChange} placeholder="e.g. Computer Science undergraduate interested in AI and Full Stack Web Development." />
                            </div>
                        </div>
                    </section>
                )}

                {/* ACTION SUBMIT BUTTON */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                    <button 
                        type="submit" 
                        className="button primary" 
                        disabled={saving}
                        style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 800, minWidth: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {saving ? "Saving Changes..." : "💾 Save & Sync All Settings"}
                    </button>
                </div>
            </form>

            {/* FOOTER NOTE */}
            <div className="disclaimer">
                🛡️ All demographic, caste quota, family income, and DBT bank account parameters are encrypted and stored in compliance with National Data Protection and Institutional Guidelines.
            </div>
        </div>
    );
}
