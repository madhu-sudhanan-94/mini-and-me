import React, { useState } from "react";
import { ChevronLeft, KeyRound, Mail, Trash2 } from "lucide-react";
import { SUPPORT } from "../content/legal.js";
import PasswordField from "../components/PasswordField.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { useStore } from "../store.jsx";

export default function Security() {
  const { setScreen, updateAccount, profile, auth, logout, showToast } = useStore();
  const email = profile?.email || auth.id || "";
  const [newEmail, setNewEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const changePassword = async () => {
    if (pw.length < 6) { showToast("Password must be at least 6 characters"); return; }
    setBusy(true);
    const { ok } = await updateAccount({ password: pw });
    setBusy(false);
    if (ok) { setPw(""); showToast("Password changed"); }
  };

  const changeEmail = async () => {
    const e = newEmail.trim().toLowerCase();
    if (!e || !e.includes("@")) { showToast("Enter a valid email"); return; }
    setBusy(true);
    const { ok } = await updateAccount({ email: e });
    setBusy(false);
    if (ok) { setNewEmail(""); showToast("Check your new email to confirm the change"); }
  };

  const deleteAccount = () => {
    if (typeof window !== "undefined" && !window.confirm("Delete your account? You'll be signed out and our team will remove your data.")) return;
    if (typeof window !== "undefined") {
      window.location.href = `mailto:${SUPPORT.email}?subject=${encodeURIComponent("Account deletion request")}&body=${encodeURIComponent("Please delete my account and data: " + email)}`;
    }
    logout();
  };

  return (
    <div className="pb-10">
      <div className="px-5 pt-2 flex items-center gap-3">
        <button onClick={() => setScreen("account")} aria-label="Back" className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-extrabold text-slate-900">Login &amp; security</h2>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Change password */}
        <div className="bg-white rounded-2xl shadow-xs p-4">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3"><KeyRound size={16} className="text-brand-600" /> Change password</p>
          <PasswordField value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" placeholder="New password (min 6 characters)" />
          <PrimaryButton variant="solid" size="md" onClick={changePassword} disabled={busy} className="mt-3 text-sm">Update password</PrimaryButton>
        </div>

        {/* Change email */}
        <div className="bg-white rounded-2xl shadow-xs p-4">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-1"><Mail size={16} className="text-brand-600" /> Change email</p>
          <p className="text-xs text-slate-400 mb-3">Current: {email || "—"}</p>
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" placeholder="New email address" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
          <PrimaryButton variant="solid" size="md" onClick={changeEmail} disabled={busy} className="mt-3 text-sm">Update email</PrimaryButton>
          <p className="text-[11px] text-slate-400 mt-2">You'll get a confirmation link at the new address.</p>
        </div>

        {/* Delete account */}
        <div className="bg-white rounded-2xl shadow-xs p-4">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-1"><Trash2 size={16} className="text-red-500" /> Delete account</p>
          <p className="text-xs text-slate-400 mb-3">Permanently remove your account and data. This sends a request to our team and signs you out.</p>
          <button onClick={deleteAccount} className="w-full border border-red-200 text-red-500 font-semibold py-2.5 rounded-xl text-sm">Request account deletion</button>
        </div>
      </div>
    </div>
  );
}
