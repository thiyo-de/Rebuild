import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';

interface FileSharerPluginType {
  shareJsonFile: (options: { filename: string; content: string }) => Promise<void>;
}

const FileSharer = registerPlugin<FileSharerPluginType>('FileSharer');

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Initialize native system UI (Status Bar dark mode and background)
 */
export const initNativeSystemUI = async () => {
  if (!isNativePlatform()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#090D16' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn('Native StatusBar init skipped:', err);
  }
};

/**
 * Trigger subtle tactile haptic feedback for UI interactions
 */
export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' = 'light') => {
  if (!isNativePlatform()) return;
  try {
    if (type === 'selection') {
      await Haptics.selectionStart();
    } else if (type === 'light') {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (type === 'medium') {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (type === 'heavy') {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (type === 'success') {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (type === 'warning') {
      await Haptics.notification({ type: NotificationType.Warning });
    } else if (type === 'error') {
      await Haptics.notification({ type: NotificationType.Error });
    }
  } catch {
    // Graceful fallback on non-haptic devices
  }
};

export const nativeHaptics = {
  selection: () => triggerHaptic('selection'),
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  impactLight: () => triggerHaptic('light'),
  impactMedium: () => triggerHaptic('medium'),
  impactHeavy: () => triggerHaptic('heavy'),
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error'),
};

/**
 * Share JSON backup as an actual .json file via Native FileSharer (FileProvider) or Web Blob download
 */
export const exportBackupNative = async (stateJson: string, filename: string) => {
  if (isNativePlatform()) {
    try {
      await FileSharer.shareJsonFile({ filename, content: stateJson });
      return;
    } catch (err) {
      console.warn('Native FileSharer failed, trying fallback:', err);
    }
  }

  // Web fallback: download as true application/json file
  try {
    const blob = new Blob([stateJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.warn('Blob download failed, using data URI fallback:', err);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(stateJson);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
};
