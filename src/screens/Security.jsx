import React, { useState } from "react";
import { ChevronLeft, KeyRound, Mail, Trash2 } from "lucide-react";
import { SUPPORT } from "../content/legal.js";
import PasswordField from "../components/PasswordField.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { useStore } from "../store.jsx";

function CardHead({ icon: Icon, tint, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-3.5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}><Icon size={18} /></div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Security() {
  const { goBack, updateAccount, profile, auth, logout, showToast } = useStore();
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
      <div className="px-5 pt-[18px] flex items-center gap-3">
        <button onClick={() => goBack("account")} aria-label="Back" className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center"><ChevronLeft size={20} /></button>
        <h2 className="text-2xl font-semibold text-slate-900">Login &amp; security</h2>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Change password */}
        <div className="bg-white rounded-2xl shadow-xs p-4">
          <CardHead icon={KeyRound} tint="bg-brand-50 text-brand-600" title="Change password" subtitle="Update the password you use to sign in — at least 6 characters." />
          <PasswordField value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" placeholder="New password (min 6 characters)" />
          <PrimaryButton variant="solid" size="md" onClick={changePassword} disabled={busy} className="mt-3 text-sm">Update password</PrimaryButton>
        </div>

        {/* Change email */}
        <div className="bg-white rounded-2xl shadow-xs p-4">
          <CardHead icon={Mail} tint="bg-violet-50 text-violet-600" title="Change email" subtitle={`Current: ${email || "—"}`} />
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" placeholder="New email address" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
          <PrimaryButton variant="solid" size="md" onClick={changeEmail} disabled={busy} className="mt-3 text-sm">Update email</PrimaryButton>
          <p className="text-[11px] text-slate-400 mt-2">We'll send a confirmation link to the new address.</p>
        </div>

        {/* Delete account */}
        <div className="bg-white rounded-2xl shadow-xs p-4">
          <CardHead icon={Trash2} tint="bg-red-50 text-red-500" title="Delete account" subtitle="Permanently remove your account and data. This sends a request to our team and signs you out." />
          <button onClick={deleteAccount} className="w-full border border-red-200 text-red-500 font-semibold py-2.5 rounded-xl text-sm hover:bg-red-50 active:scale-[0.99] transition">Request account deletion</button>
        </div>
      </div>
    </div>
  );
}
