import { useEffect, useState } from "react";

function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(
    typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches
  );
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return { ok: false, message: "Install prompt unavailable." };
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice?.outcome === "accepted") {
      setInstallPrompt(null);
      return { ok: true };
    }
    return { ok: false, message: "Install dismissed." };
  };

  return {
    canInstall: Boolean(installPrompt) && !isInstalled,
    isInstalled,
    isOnline,
    install,
  };
}

export default usePwaInstall;
