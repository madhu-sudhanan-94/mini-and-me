import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/* Password input with a show/hide toggle. `wrapClass` styles the outer div. */
export default function PasswordField({ value, onChange, placeholder, autoComplete, wrapClass = "" }) {
  const [show, setShow] = useState(false);
  return (
    <div className={`relative ${wrapClass}`}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl py-3 pl-3 pr-11 outline-hidden text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
      />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400">
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
