import { Capacitor } from '@capacitor/core';

/** True inside the iPhone (or Android) app built with Capacitor, false on the website. */
export const isNativeApp = Capacitor.isNativePlatform();

/** 'ios' | 'android' | 'web' */
export const platformName = Capacitor.getPlatform();

/** Where sign-in sends players back to the app (registered as a URL scheme in ios/App/App/Info.plist). */
export const NATIVE_AUTH_REDIRECT = 'app.lumipals://auth';
