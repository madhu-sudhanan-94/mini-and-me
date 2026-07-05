import React, { useState, useEffect } from "react";
import { ChevronLeft, Camera } from "lucide-react";
import { panelBlue } from "../theme.js";
import PhoneField from "../components/PhoneField.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
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
  const { profile, saveProfile, profileBusy, auth, setScreen, uploadAvatar, avatarBusy } = useStore();
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

  // avatar: optimistic local preview while uploading + graceful fallback on a broken URL
  const [preview, setPreview] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => { setImgFailed(false); }, [profile?.avatar_url]);
  useEffect(() => { if (!avatarBusy) setPreview(null); }, [avatarBusy]);
  const avatarSrc = preview || (profile?.avatar_url && !imgFailed ? profile.avatar_url : null);

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
        <div className="px-5 pt-[18px] flex items-center gap-3">
          <button onClick={() => setScreen("account")} aria-label="Back" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"><ChevronLeft size={20} className="text-white" /></button>
          <h2 className="text-xl font-bold text-white">Edit profile</h2>
        </div>
        <div className="flex flex-col items-center mt-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden ring-4 ring-white/25">
              {avatarSrc
                ? <img src={avatarSrc} alt="Profile photo" onError={() => setImgFailed(true)} className="w-full h-full object-cover" />
                : <span className="text-white text-2xl font-extrabold">{initials(f.full_name, email)}</span>}
            </div>
            <label title="Change photo" className={`absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white text-brand-600 shadow-md flex items-center justify-center ${avatarBusy ? "opacity-60 cursor-wait" : "cursor-pointer"}`}>
              <Camera size={16} />
              <input type="file" accept="image/*" className="hidden" disabled={avatarBusy}
                onChange={(e) => { const file = e.target.files && e.target.files[0]; if (file) { setPreview(URL.createObjectURL(file)); uploadAvatar(file); } e.target.value = ""; }} />
            </label>
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
            <PhoneField value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Gender</label>
              <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} className="w-full border border-slate-200 rounded-xl py-3 pl-2.5 pr-9 outline-hidden text-sm focus:border-brand-500 bg-white select-chevron">
                {GENDERS.map((g) => <option key={g.label} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date of birth</label>
              <input type="date" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} className="w-full border border-slate-200 rounded-xl py-3 px-2.5 outline-hidden text-sm focus:border-brand-500" />
            </div>
          </div>

          <PrimaryButton onClick={save} disabled={profileBusy}>
            {profileBusy ? "Saving…" : "Save profile"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
