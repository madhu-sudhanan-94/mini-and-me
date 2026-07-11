import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { BRAND } from "../brand.config.js";
import { panelBlue } from "../theme.js";
import PasswordField from "../components/PasswordField.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { useStore } from "../store.jsx";

const Logo = BRAND.logo;

export default function ResetPassword() {
  const { setNewPassword, setScreen } = useStore();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (pw !== pw2) { setErr("Passwords don't match."); return; }
    setBusy(true);
    await setNewPassword(pw);
    setBusy(false);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="relative pb-8 rounded-b-[2.5rem] shrink-0" style={panelBlue}>
        <div className="px-6 pt-8">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-5">
            <Logo size={26} className="text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold leading-tight">Set a new password</h1>
          <p className="text-brand-100 mt-1.5 text-sm">Choose a new password for your {BRAND.name} account.</p>
        </div>
      </div>

      <div className="px-6 pt-5">
        <form onSubmit={submit} className="bg-white rounded-3xl shadow-xl p-5">
          <PasswordField value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} autoComplete="new-password" placeholder="New password (min 6 characters)" />
          <PasswordField value={pw2} onChange={(e) => { setPw2(e.target.value); setErr(""); }} autoComplete="new-password" placeholder="Confirm new password" wrapClass="mt-2.5" />
          {err && <p className="text-red-500 text-xs mt-2.5">{err}</p>}
          <PrimaryButton type="submit" disabled={busy} className="mt-4">
            {busy ? "Saving…" : (<>Update password <ArrowRight size={18} /></>)}
          </PrimaryButton>
        </form>
        {/* escape route — the screen is reached from an email link, so give a way back */}
        <button onClick={() => setScreen("home")} className="w-full text-center text-sm font-semibold text-slate-500 mt-4 py-2 active:scale-95 transition">Back to store</button>
      </div>
    </div>
  );
}
