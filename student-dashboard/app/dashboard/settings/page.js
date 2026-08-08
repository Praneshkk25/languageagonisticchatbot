"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
    const [savedSuccess, setSavedSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "Pranesh K K",
        id: "2023CS001",
        department: "CSE",
        year: "5",
        email: "pranesh.kk@college.edu",
        phone: "+91 98765 43210",
        bio: "Computer Science Undergraduate interested in AI & Full Stack Web Development."
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    setFormData(prev => ({
                        ...prev,
                        name: u.name || prev.name,
                        id: u.id || prev.id,
                        department: u.department || prev.department,
                        year: u.year ? String(u.year) : prev.year,
                        email: u.email || prev.email,
                        phone: u.phone || prev.phone,
                        bio: u.bio || prev.bio
                    }));
                } catch(e) {}
            }
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        if (typeof window !== "undefined") {
            const userObj = {
                name: formData.name,
                id: formData.id,
                department: formData.department,
                year: formData.year,
                email: formData.email,
                phone: formData.phone,
                bio: formData.bio
            };
            localStorage.setItem("user", JSON.stringify(userObj));
            
            // Notify layout component to reload profile info across ALL sidebar instances immediately!
            window.dispatchEvent(new Event("userProfileUpdated"));

            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {savedSuccess && (
                <div style={{ padding: '14px 20px', borderRadius: '10px', background: 'rgba(66, 214, 164, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontWeight: 700, fontSize: '13px' }}>
                    ✓ Profile updated successfully! The sidebar user card has been updated across all pages.
                </div>
            )}

            {/* PROFILE DETAILS PANEL */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Student Profile Details</div>
                        <div className="panel-subtitle">Update your personal information & academic identification</div>
                    </div>
                    <span className="badge">Active Profile</span>
                </div>

                <form onSubmit={handleSaveProfile} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Student Roll ID Number</label>
                            <input
                                type="text"
                                name="id"
                                className="input"
                                value={formData.id}
                                onChange={handleChange}
                                required
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
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Semester / Year</label>
                            <input
                                type="text"
                                name="year"
                                className="input"
                                value={formData.year}
                                onChange={handleChange}
                            />
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
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Contact Phone</label>
                            <input
                                type="text"
                                name="phone"
                                className="input"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Bio / Description</label>
                        <textarea
                            name="bio"
                            className="input"
                            rows="3"
                            value={formData.bio}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button type="submit" className="button primary">
                            Save Profile Changes
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
                🛡️ Your profile details and security settings are saved securely on your local device.
            </div>
        </div>
    );
}
