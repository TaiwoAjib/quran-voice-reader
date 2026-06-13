// Local Expo config plugin.
// The @react-native-voice/voice plugin only adds permissions — it does NOT add
// the Android 11+ package-visibility <queries> needed to reach the on-device
// speech recognizer. Without this, Voice.start() fails silently and the voice
// search never returns results. This plugin injects the required queries so the
// fix survives `expo prebuild`.
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidSpeechQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    manifest.queries = manifest.queries || [];

    // Intent query for the speech recognition service
    const hasRecognitionIntent = manifest.queries.some((q) =>
      (q.intent || []).some((i) =>
        (i.action || []).some((a) => a.$?.['android:name'] === 'android.speech.RecognitionService')
      )
    );
    if (!hasRecognitionIntent) {
      manifest.queries.push({
        intent: [{ action: [{ $: { 'android:name': 'android.speech.RecognitionService' } }] }],
      });
    }

    // Explicit package visibility for the common providers
    const pkgs = ['com.google.android.googlequicksearchbox', 'com.google.android.tts'];
    const existingPkgs = new Set();
    manifest.queries.forEach((q) =>
      (q.package || []).forEach((p) => existingPkgs.add(p.$?.['android:name']))
    );
    const toAdd = pkgs.filter((p) => !existingPkgs.has(p));
    if (toAdd.length) {
      manifest.queries.push({
        package: toAdd.map((name) => ({ $: { 'android:name': name } })),
      });
    }

    return cfg;
  });
};
