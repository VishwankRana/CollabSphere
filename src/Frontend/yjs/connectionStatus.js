export function getConnectionStatus(provider) {
  if (!provider?.wsconnected && !provider?.wsconnecting) {
    return "disconnected";
  }

  if (provider.synced) {
    return "synced";
  }

  if (provider.wsconnecting) {
    return "connecting";
  }

  return "connected";
}

export function attachYjsConnectionListeners(provider, { onStatusChange, onOffline } = {}) {
  let hasBeenSynced = false;
  let syncFallbackTimeout = null;

  function clearSyncFallback() {
    window.clearTimeout(syncFallbackTimeout);
    syncFallbackTimeout = null;
  }

  function scheduleSyncFallback() {
    clearSyncFallback();

    syncFallbackTimeout = window.setTimeout(() => {
      if (provider.wsconnected && !provider.synced) {
        hasBeenSynced = true;
        onStatusChange?.("synced");
      }
    }, 2000);
  }

  function notifyOfflineIfNeeded() {
    if (!hasBeenSynced) {
      return;
    }

    onOffline?.();
  }

  function updateConnectionStatus() {
    const nextStatus = getConnectionStatus(provider);
    onStatusChange?.(nextStatus);

    if (nextStatus === "synced") {
      hasBeenSynced = true;
      clearSyncFallback();
      return;
    }

    if (nextStatus === "disconnected" && hasBeenSynced) {
      notifyOfflineIfNeeded();
      clearSyncFallback();
      return;
    }

    if (nextStatus === "connected") {
      scheduleSyncFallback();
    }
  }

  function handleStatus({ status }) {
    if (status === "connected") {
      updateConnectionStatus();
      window.setTimeout(updateConnectionStatus, 0);
      window.setTimeout(updateConnectionStatus, 250);
      return;
    }

    updateConnectionStatus();
  }

  function handleConnectionError() {
    onStatusChange?.("disconnected");
    notifyOfflineIfNeeded();
    clearSyncFallback();
  }

  updateConnectionStatus();

  provider.on("status", handleStatus);
  provider.on("sync", updateConnectionStatus);
  provider.on("connection-close", updateConnectionStatus);
  provider.on("connection-error", handleConnectionError);

  return () => {
    clearSyncFallback();
    provider.off("status", handleStatus);
    provider.off("sync", updateConnectionStatus);
    provider.off("connection-close", updateConnectionStatus);
    provider.off("connection-error", handleConnectionError);
  };
}
