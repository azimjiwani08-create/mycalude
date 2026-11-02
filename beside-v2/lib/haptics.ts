import { Capacitor } from "@capacitor/core";

/** A light tap when the feed snaps to a new companion. Only does anything inside the iOS app. */
export async function lightHaptic() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // No haptics available: nothing to do.
  }
}
