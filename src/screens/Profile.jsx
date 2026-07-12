import React, { useState, useEffect } from "react";
import { Camera } from "lucide-react";
import ScreenHeader from "../components/ScreenHeader.jsx";
import PhoneField from "../components/PhoneField.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { useStore } from "../store.jsx";

const GENDERS = [
  { value: "", label: "Prefer not to say" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

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
      <div className="px-5 pt-[18px]">
        <ScreenHeader title="Edit profile" back="account" padded={false} />
        <div className="flex flex-col items-center mt-4">
          <label className={`group relative flex flex-col items-center justify-center w-28 h-28 rounded-full transition ${avatarBusy ? "cursor-wait" : "cursor-pointer"} ${avatarSrc ? "overflow-hidden ring-4 ring-white shadow-lg" : "border-2 border-dashed border-brand-300 bg-linear-to-br from-brand-50 to-accent-50 hover:from-brand-100 hover:to-accent-100"}`}>
            {avatarSrc ? (
              <>
                <img src={avatarSrc} alt="Profile photo" onError={() => setImgFailed(true)} className="w-full h-full object-cover" />
                {/* subtle change hint — whole circle is tappable to swap the photo */}
                <div className="absolute inset-x-0 bottom-0 pt-6 pb-2 flex items-center justify-center gap-1 text-white bg-linear-to-t from-black/55 to-transparent group-hover:from-black/65 transition">
                  <Camera size={13} /><span className="text-[11px] font-medium">Change</span>
                </div>
              </>
            ) : (
              <>
                <Camera size={22} className="text-brand-500" />
                <span className="mt-1 text-[11px] font-semibold text-brand-600">Add photo</span>
              </>
            )}
            {avatarBusy && <div className="absolute inset-0 rounded-full bg-white/60 flex items-center justify-center"><span className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /></div>}
            <input type="file" accept="image/*" className="hidden" disabled={avatarBusy}
              onChange={(e) => { const file = e.target.files && e.target.files[0]; if (file) { setPreview(URL.createObjectURL(file)); uploadAvatar(file); } e.target.value = ""; }} />
          </label>
          <p className="mt-2.5 text-xs text-slate-400">{avatarSrc ? "Tap the photo to change it" : "Add a profile photo — JPG or PNG"}</p>
        </div>
      </div>

      <div className="px-5 mt-5">
        <div className="bg-white rounded-xl shadow-card p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Full name</label>
            <input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} placeholder="Your Name" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400 placeholder:font-normal" />
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
              <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} className="w-full border border-slate-200 rounded-xl py-3 pl-2.5 pr-9 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 bg-white select-chevron">
                {GENDERS.map((g) => <option key={g.label} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date of birth</label>
              <input type="date" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} className="w-full border border-slate-200 rounded-xl py-3 pl-2.5 pr-2.5 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" />
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
