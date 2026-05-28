import { NextResponse } from "next/server";

const ASSET_LINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.anonymous.appnewbi",
      sha256_cert_fingerprints: [
        // TODO: Replace with actual SHA256 fingerprint from signed Android build
        // Run: keytool -list -v -keystore <keystore> | grep SHA256
        "TO_BE_CONFIGURED_AFTER_ANDROID_BUILD",
      ],
    },
  },
];

export async function GET() {
  return NextResponse.json(ASSET_LINKS, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
