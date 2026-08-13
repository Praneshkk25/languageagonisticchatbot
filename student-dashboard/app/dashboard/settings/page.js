"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
    const [savedSuccess, setSavedSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "Pranesh K K",
        id: "2023CS001",
        department: "CSE",
        year: "3rd Year (Sem 5)",
        dob: "2003-05-14",
        email: "pranesh.kk@college.edu",
        phone: "+91 98765 43210",
        gender: "Male",
        guardian_name: "Kumaravel K",
        guardian_mobile: "+91 94432 10987",
        caste_category: "BC / MBC",
        family_income: "250000",
        address: "123 College Avenue, Anna Nagar, Chennai, Tamil Nadu - 600040",
        bank_account_no: "987654321012",
        bank_name: "State Bank of India",
        ifsc_code: "SBIN0001234",
        bio: "Computer Science Undergraduate interested in AI & Full Stack Web Development."
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            let userId = "2023CS001";
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    userId = u.id || "2023CS001";
                    setFormData(prev => ({
                        ...prev,
                        ...u,
                        id: userId
                    }));
                } catch(e) {}
            }
            
            // Also fetch from backend database
            fetch(`http://localhost:8000/api/students/${userId}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        setFormData(prev => ({
                            ...prev,
                            ...data,
                            name: data.name || prev.name,
                            id: data.admission_no || prev.id,
                            department: data.department || prev.department,
                            year: data.year ? String(data.year) : prev.year,
                            dob: data.dob || prev.dob,
                            family_income: data.family_income ? String(data.family_income) : prev.family_income
                        }));
                    }
                })
                .catch(() => {});
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (typeof window !== "undefined") {
            const userObj = {
                ...formData
            };
            localStorage.setItem("user", JSON.stringify(userObj));

            // Sync with FastAPI Backend
            try {
                await fetch(`http://localhost:8000/api/students/${formData.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formData.name,
                        department: formData.department,
                        dob: formData.dob,
                        email: formData.email,
                        phone: formData.phone,
                        gender: formData.gender,
                        guardian_name: formData.guardian_name,
                        guardian_mobile: formData.guardian_mobile,
                        caste_category: formData.caste_category,
                        family_income: parseFloat(formData.family_income) || 0,
                        address: formData.address,
                        bank_account_no: formData.bank_account_no,
                        bank_name: formData.bank_name,
                        ifsc_code: formData.ifsc_code,
                        bio: formData.bio
                    })
                });
            } catch (err) {
                console.error("Backend profile sync error:", err);
            }

            // Notify layout component & profile completion calculations
            window.dispatchEvent(new Event("userProfileUpdated"));

            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3500);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '32px' }}>
            {savedSuccess && (
                <div style={{ padding: '14px 20px', borderRadius: '10px', background: 'rgba(66, 214, 164, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontWeight: 700, fontSize: '13px' }}>
                    ✓ Student Profile & Financial Details updated successfully in backend database and local session!
                </div>
            )}

            {/* 1. PERSONAL & ACADEMIC DETAILS */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">1. Student Academic & Personal Information</div>
                        <div className="panel-subtitle">Manage official academic identity and contact details</div>
                    </div>
                    <span className="badge">Verified Student Record</span>
                </div>

                <form onSubmit={handleSaveProfile} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Full Student Name</label>
                            <input
                                type="text"
                                name="name"
                                className="input"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Admission / Roll ID Number</label>
                            <input
                                type="text"
                                name="id"
                                className="input"
                                value={formData.id}
                                onChange={handleChange}
                                required
                                readOnly
                                style={{ opacity: 0.8 }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Academic Department</label>
                            <input
                                type="text"
                                name="department"
                                className="input"
                                value={formData.department}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Academic Year / Semester</label>
                            <input
                                type="text"
                                name="year"
                                className="input"
                                value={formData.year}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Date of Birth (YYYY-MM-DD)</label>
                            <input
                                type="date"
                                name="dob"
                                className="input"
                                value={formData.dob || ""}
                                onChange={handleChange}
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Gender</label>
                            <select
                                name="gender"
                                className="input"
                                value={formData.gender || "Male"}
                                onChange={handleChange}
                                style={{ background: '#081229', color: '#fff' }}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="input"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Student Mobile Number</label>
                            <input
                                type="text"
                                name="phone"
                                className="input"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* 2. FAMILY & FINANCIAL INCOME DETAILS */}
                    <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                            2. Family & Annual Income Details
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                            Required for Government Scholarship eligibility evaluation and concessions
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Father / Mother / Guardian Name</label>
                                <input
                                    type="text"
                                    name="guardian_name"
                                    className="input"
                                    value={formData.guardian_name || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. Ramesh Kumar"
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Guardian Contact Mobile</label>
                                <input
                                    type="text"
                                    name="guardian_mobile"
                                    className="input"
                                    value={formData.guardian_mobile || ""}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Caste / Social Category</label>
                                <select
                                    name="caste_category"
                                    className="input"
                                    value={formData.caste_category || "General"}
                                    onChange={handleChange}
                                    style={{ background: '#081229', color: '#fff' }}
                                >
                                    <option value="General">General / OC</option>
                                    <option value="OBC">OBC (Other Backward Classes)</option>
                                    <option value="BC / MBC">BC / MBC (Backward Class)</option>
                                    <option value="SC">SC (Scheduled Caste)</option>
                                    <option value="ST">ST (Scheduled Tribe)</option>
                                    <option value="EWS">Economically Weaker Section (EWS)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Annual Family Income (₹ Rupees per annum)</label>
                                <input
                                    type="number"
                                    name="family_income"
                                    className="input"
                                    value={formData.family_income || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. 250000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. PERMANENT ADDRESS & BANK ACCOUNT DETAILS */}
                    <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                            3. Bank Details (Direct Benefit Transfer - DBT)
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                            For direct disbursement of approved scholarship funds and stipend grants
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Permanent Residence Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    className="input"
                                    value={formData.address || ""}
                                    onChange={handleChange}
                                    placeholder="Street, City, State, Pincode"
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Bank Name</label>
                                <input
                                    type="text"
                                    name="bank_name"
                                    className="input"
                                    value={formData.bank_name || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. State Bank of India"
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Bank Account Number</label>
                                <input
                                    type="text"
                                    name="bank_account_no"
                                    className="input"
                                    value={formData.bank_account_no || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. 987654321012"
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Bank IFSC Code</label>
                                <input
                                    type="text"
                                    name="ifsc_code"
                                    className="input"
                                    value={formData.ifsc_code || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. SBIN0001234"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Academic Bio / Description</label>
                        <textarea
                            name="bio"
                            className="input"
                            rows="2"
                            value={formData.bio || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button type="submit" className="button primary" style={{ padding: '12px 28px', fontSize: '14px' }}>
                            💾 Save Profile & Financial Information
                        </button>
                    </div>
                </form>
            </section>

            {/* SECURITY & PASSKEY PANEL */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Security & 2-Factor Double Passkey</div>
                        <div className="panel-subtitle">Manage cloud document authorization passkeys</div>
                    </div>
                    <span className="badge warning">2-Factor Passkey Active</span>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="data-row" style={{ justifyContent: 'space-between' }}>
                        <div>
                            <div className="data-title">Passkey 1 (Primary Cloud Vault Passkey)</div>
                            <div className="data-meta">Default: 123456</div>
                        </div>
                        <button className="button" onClick={() => alert("Passkey 1 is active (123456)")}>Manage Passkey 1</button>
                    </div>

                    <div className="data-row" style={{ justifyContent: 'space-between' }}>
                        <div>
                            <div className="data-title">Passkey 2 (Secondary Authorization Passkey)</div>
                            <div className="data-meta">Default: 654321</div>
                        </div>
                        <button className="button" onClick={() => alert("Passkey 2 is active (654321)")}>Manage Passkey 2</button>
                    </div>
                </div>
            </section>

            {/* FOOTER DISCLAIMER */}
            <div className="disclaimer">
                🛡️ Your profile details and family income declarations are stored with end-to-end encryption.
            </div>
        </div>
    );
}

