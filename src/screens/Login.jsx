import React from "react";
import { ChevronLeft, Mail, Phone, Check, ArrowRight } from "lucide-react";
import { BRAND } from "../brand.config.js";
import { panelBlue } from "../theme.js";
import { useStore } from "../store.jsx";

const Logo = BRAND.logo;

export default function Login() {
  const {
    returnTo, setReturnTo, setScreen, setAuth, authBusy, handleAuth,
    loginEmail, setLoginEmail, setAuthErr, loginPassword, setLoginPassword,
    authMode, setAuthMode, authErr, authNotice, setAuthNotice,
  } = useStore();

  return (
    <div className="flex flex-col min-h-full">
      <div className="relative pb-12 rounded-b-[2.5rem]" style={panelBlue}>
        <div className="px-6 pt-2">
          <button onClick={() => { const dest = returnTo || "home"; setReturnTo(null); setScreen(dest); }} aria-label="Back" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <ChevronLeft size={20} className="text-white" />
          </button>
        </div>
        <div className="px-6 pt-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-5">
            <Logo size={26} className="text-white" />
          </div>
          <h1 className="text-white text-3xl font-extrabold leading-tight">{BRAND.name}</h1>
          <p className="text-brand-100 mt-1.5 text-sm">{BRAND.tagline}</p>
        </div>
      </div>

      <div className="px-6 -mt-6">
        <div className="bg-white rounded-3xl shadow-xl p-5">
          <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
            <button className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 bg-white shadow-sm text-brand-600">
              <Mail size={15} /> Email
            </button>
            <button disabled className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 text-slate-400 cursor-not-allowed">
              <Phone size={15} /> Phone <span className="text-[9px] font-bold bg-slate-200 text-slate-500 rounded-sm px-1 py-0.5">SOON</span>
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if (!authBusy) handleAuth(); }}>
            <input value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setAuthErr(""); }} type="email" autoComplete="email" placeholder="you@email.com" className="w-full border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />
            <input value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setAuthErr(""); }} type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} placeholder="Password (min 6 characters)" className="w-full mt-2.5 border border-slate-200 rounded-xl py-3 px-3 outline-hidden text-sm focus:border-brand-500" />

            {authErr && <p className="text-red-500 text-xs mt-2.5">{authErr}</p>}
            {authNotice && (
              <div className="mt-2.5 bg-brand-50 border border-brand-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <Check size={15} className="text-brand-600 shrink-0 mt-0.5" />
                <p className="text-xs text-brand-700">{authNotice}</p>
              </div>
            )}

            <button type="submit" disabled={authBusy} className="w-full mt-4 bg-linear-to-r from-brand-600 to-accent-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-brand-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
              {authBusy ? "Please wait…" : (<>{authMode === "signup" ? "Create account" : "Log in"} <ArrowRight size={18} /></>)}
            </button>
          </form>

          <button onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthErr(""); setAuthNotice(""); }} className="w-full mt-3 text-brand-600 text-sm font-semibold py-1.5">
            {authMode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}
          </button>

          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[11px] text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button onClick={() => { setReturnTo(null); setAuth({ role: "guest", id: null }); setScreen("home"); }} className="w-full text-slate-500 text-sm font-medium py-2">
            Skip for now →
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4 px-4">
          Admin? Log in with your admin email to manage products.
        </p>
      </div>
    </div>
  );
}
