import React, { useEffect, useState, useRef } from "react";

// Listens for the "server-waking-up" / "server-awake" events dispatched by
// the api.js interceptor. Shows a friendly banner instead of letting a
// Render free-tier cold start look like a broken page.
const ServerWakingBanner = () => {
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    const handleWakingUp = () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      setVisible(true);
    };

    const handleAwake = () => {
      // Small delay so the banner doesn't just flash and disappear
      hideTimeoutRef.current = setTimeout(() => setVisible(false), 800);
    };

    window.addEventListener("server-waking-up", handleWakingUp);
    window.addEventListener("server-awake", handleAwake);

    return () => {
      window.removeEventListener("server-waking-up", handleWakingUp);
      window.removeEventListener("server-awake", handleAwake);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-primary-500 text-white text-sm py-2 px-4 flex items-center justify-center gap-2 shadow-md">
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span>
        Connexion au serveur en cours, cela peut prendre quelques secondes...
      </span>
    </div>
  );
};

export default ServerWakingBanner;