import React, { useState } from "react";
import { ChevronLeft, Mail, Phone, Check, ArrowRight } from "lucide-react";
import { BRAND } from "../brand.config.js";
import PhoneField from "../components/PhoneField.jsx";
import PasswordField from "../components/PasswordField.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { useStore } from "../store.jsx";

const Logo = BRAND.logo;

/* Brand social logos — visual for now; enable real OAuth in Supabase to wire them. */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.6 34.6 26.9 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.6 5.6C41.2 36.6 44 30.9 44 24c0-1.3-.1-2.3-.4-3.5z" />
  </svg>
);
const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#000" aria-hidden="true"><path d="M16.4 12.9c0-2.6 2.1-3.8 2.2-3.9-1.2-1.7-3-2-3.7-2-1.6-.2-3 .9-3.8.9s-2-.9-3.3-.9C6.1 7 4.5 8 3.7 9.5 2 12.5 3.2 17 4.9 19.4c.8 1.2 1.8 2.5 3.1 2.5 1.2-.1 1.7-.8 3.2-.8s1.9.8 3.2.8 2.2-1.2 3-2.4c.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.5-1-2.5-3.8zM14.3 5.3c.7-.8 1.1-2 1-3.1-1 0-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.6 2.8-1.3z" /></svg>
);
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true"><path d="M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.9V12h3.3l-.5 3.5h-2.8v8.4C19.6 23 24 18 24 12z" /></svg>
);

export default function Login() {
  const {
    returnTo, setReturnTo, setScreen, setAuth, authBusy, handleAuth,
    loginEmail, setLoginEmail, setAuthErr, loginPassword, setLoginPassword,
    authMode, setAuthMode, authErr, authNotice, setAuthNotice,
    loginTab, setLoginTab, loginPhone, setLoginPhone, otp, setOtp, otpSent, otpErr,
    sendPhoneOtp, verifyPhoneOtp, resetPhoneLogin, requestPasswordReset, showToast,
  } = useStore();
  const [logoFailed, setLogoFailed] = useState(false);
  const isSignup = authMode === "signup";

  const back = () => { const dest = returnTo || "home"; setReturnTo(null); setScreen(dest); };
  const social = (name) => showToast(`${name} sign-in is coming soon`);
  const socialBtn = "w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 active:scale-95 transition";
  const inputCls = "w-full border border-slate-200 rounded-xl py-3.5 px-4 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition";

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-[18px]">
        <button onClick={back} aria-label="Back" className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center active:scale-95 transition"><ChevronLeft size={20} className="text-slate-700" /></button>
      </div>

      <div className="flex-1 px-7 pb-8 w-full mx-auto">
        {/* Header */}
        <div className="text-center mt-2 mb-6">
          {BRAND.icon && !logoFailed ? (
            <div className="w-16 h-16 rounded-2xl bg-white shadow-md ring-1 ring-slate-100 mx-auto mb-4 flex items-center justify-center overflow-hidden">
              <img src={BRAND.icon} alt={BRAND.name} onError={() => setLogoFailed(true)} className="w-full h-full object-contain p-1.5" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-brand-500 to-accent-400 shadow-lg mx-auto mb-4 flex items-center justify-center"><Logo size={28} className="text-white" /></div>
          )}
          <h1 className="text-2xl font-extrabold text-slate-900">{isSignup ? "Create account" : "Welcome back"}</h1>
          <p className="text-slate-500 text-sm mt-1.5">{isSignup ? `Sign up to start shopping with ${BRAND.name}.` : "Log in to your account to continue."}</p>
        </div>

        {/* Email / Phone tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
          <button onClick={() => setLoginTab("email")} className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${loginTab === "email" ? "bg-white shadow-sm text-brand-600" : "text-slate-500"}`}><Mail size={15} /> Email</button>
          <button onClick={() => setLoginTab("phone")} className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${loginTab === "phone" ? "bg-white shadow-sm text-brand-600" : "text-slate-500"}`}><Phone size={15} /> Phone</button>
        </div>

        {loginTab === "email" ? (
          <>
            <form onSubmit={(e) => { e.preventDefault(); if (!authBusy) handleAuth(); }}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setAuthErr(""); }} type="email" autoComplete="email" placeholder="Enter your email" className={inputCls} />

              <div className="flex items-center justify-between mb-1.5 mt-4">
                <label className="text-sm font-medium text-slate-700">Password</label>
                {authMode === "login" && (
                  <button type="button" onClick={requestPasswordReset} className="text-xs font-semibold text-brand-600">Forgot password?</button>
                )}
              </div>
              <PasswordField value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setAuthErr(""); }} autoComplete={isSignup ? "new-password" : "current-password"} placeholder="Enter your password" />

              {authErr && <p className="text-red-500 text-xs mt-2.5">{authErr}</p>}
              {authNotice && (
                <div className="mt-2.5 bg-brand-50 border border-brand-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <Check size={15} className="text-brand-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-brand-700">{authNotice}</p>
                </div>
              )}

              <PrimaryButton type="submit" disabled={authBusy} className="mt-5">
                {authBusy ? "Please wait…" : (isSignup ? "Create account" : "Sign in")}
              </PrimaryButton>
            </form>
          </>
        ) : (
          <>
            {!otpSent ? (
              <form onSubmit={(e) => { e.preventDefault(); sendPhoneOtp(); }}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone number</label>
                <PhoneField value={loginPhone} onChange={setLoginPhone} />
                {otpErr && <p className="text-red-500 text-xs mt-2.5">{otpErr}</p>}
                <PrimaryButton type="submit" className="mt-5">Send OTP <ArrowRight size={18} /></PrimaryButton>
              </form>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); verifyPhoneOtp(); }}>
                <p className="text-xs text-slate-500 mb-2">Enter the code sent to <span className="font-semibold text-slate-700">{loginPhone}</span></p>
                <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoFocus placeholder="• • • •" className="w-full text-center tracking-[0.6em] text-xl font-bold border border-slate-200 rounded-xl py-3 outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" />
                <div className="mt-2.5 bg-brand-50 border border-brand-100 rounded-xl px-3 py-2.5 text-xs text-brand-700">Demo mode — your code is <b>1234</b>.</div>
                {otpErr && <p className="text-red-500 text-xs mt-2.5">{otpErr}</p>}
                <PrimaryButton type="submit" disabled={otp.length < 4} className="mt-4">Verify &amp; continue <ArrowRight size={18} /></PrimaryButton>
                <button type="button" onClick={resetPhoneLogin} className="w-full mt-3 text-brand-600 text-sm font-semibold py-1.5">Change number</button>
              </form>
            )}
          </>
        )}

        {/* Or + social */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">Or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <div className="flex justify-center gap-3">
          <button onClick={() => social("Google")} aria-label="Continue with Google" className={socialBtn}><GoogleIcon /></button>
          <button onClick={() => social("Apple")} aria-label="Continue with Apple" className={socialBtn}><AppleIcon /></button>
          <button onClick={() => social("Facebook")} aria-label="Continue with Facebook" className={socialBtn}><FacebookIcon /></button>
        </div>

        {/* Toggle + skip */}
        <p className="text-center text-sm text-slate-500 mt-6">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button onClick={() => { setAuthMode(isSignup ? "login" : "signup"); setAuthErr(""); setAuthNotice(""); }} className="text-brand-600 font-semibold">{isSignup ? "Sign in" : "Sign up"}</button>
        </p>
        {/* <button onClick={() => { setReturnTo(null); setAuth({ role: "guest", id: null }); setScreen("home"); }} className="w-full text-slate-400 text-sm font-medium py-2 mt-1">Skip for now →</button> */}

        <p className="text-center text-xs text-slate-400 mt-3 px-1">Admin? Log in with your admin email to manage products.</p>
      </div>
    </div>
  );
}
