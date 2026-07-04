import React, { useState, useEffect } from "react";
import { ChevronLeft, Camera } from "lucide-react";
import { panelBlue } from "../theme.js";
import { useStore } from "../store.jsx";

const GENDERS = [
  { value: "", label: "Prefer not to say" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

function initials(name, email) {
  const base = (name || email || "").trim();
  if (!base) return "🙂";
  const parts = base.split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || base[0].toUpperCase();
}

export default function Profile() {
  const { profile, saveProfile, profileBusy, auth, setScreen } = useStore();
  const email = profile?.email || auth.id || "";

  const [f, setF] = useState({ full_name: "", phone: "", gender: "", dob: "" });
  useEffect(() => {
    if (profile) setF({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      gender: profile.gender || "",
      dob: profile.dob || "",
    });
  }, [profile]);

  const save = async () => {
    const ok = await saveProfile({
      full_name: f.full_name.trim() || null,
      phone: f.phone.trim() || null,
      gender: f.gender || null,
      dob: f.dob || null,
    });
    if (ok) setScreen("account");
  };

  return (
    <div className="pb-6">
      <div className="rounded-b-[2.5rem] pb-10" style={panelBlue}>
        <div className="px-5 pt-2 flex items-center gap-3">
          <button onClick={() => setScreen("account")} aria-label="Back" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"><ChevronLeft size={20} className="text-white" /></button>
          <h2 className="text-xl font-bold text-white">Edit profile</h2>
        </div>
        <div className="flex flex-col items-center mt-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden ring-4 ring-white/25">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-white text-2xl font-extrabold">{initials(f.full_name, email)}</span>}
            </div>
            <button type="button" disabled title="Photo upload coming soon" className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white text-brand-600 shadow-md flex items-center justify-center opacity-70 cursor-not-allowed">
              <Camera size={16} />
            </button>
          </div>
          <p className="text-white/80 text-xs mt-2">{email}</p>
        </div>
      </div>

      <div className="px-6 -mt-5">
        <div className="bg-white rounded-3xl shadow-xl p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Full name</label>
            <input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} placeholder="Your name" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Email</label>
            <input value={email} readOnly className="w-full border border-slate-100 bg-slate-50 text-slate-500 rounded-xl py-3 px-3 outline-hidden text-sm" />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Phone number</label>
            <div className="flex items-center border border-slate-200 rounded-xl px-3 focus-within:border-brand-500">
              <span className="text-slate-500 text-sm pr-2 border-r border-slate-200">+91</span>
              <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} inputMode="numeric" placeholder="Mobile number" className="flex-1 py-3 px-3 outline-hidden text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Gender</label>
              <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} className="w-full border border-slate-200 rounded-xl py-3 px-2.5 outline-hidden text-sm focus:border-brand-500 bg-white">
                {GENDERS.map((g) => <option key={g.label} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date of birth</label>
              <input type="date" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} className="w-full border border-slate-200 rounded-xl py-3 px-2.5 outline-hidden text-sm focus:border-brand-500" />
            </div>
          </div>

          <button onClick={save} disabled={profileBusy} className="w-full bg-linear-to-r from-brand-600 to-accent-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-brand-500/25 disabled:opacity-60">
            {profileBusy ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
