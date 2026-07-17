// biometrics.js
function bufferEncode(value) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(value)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function bufferDecode(value) {
    value = value.replace(/-/g, "+").replace(/_/g, "/");
    while (value.length % 4) value += "=";
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

async function isBiometricSupported() {
    return window.PublicKeyCredential ? await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() : false;
}

async function registerBiometrics() {
    const isSupported = await isBiometricSupported();
    if (!isSupported) {
        alert("Biometrics are not supported on this device/browser.");
        return false;
    }

    const userId = localStorage.getItem('userEmail') || localStorage.getItem('userPhone') || "CM-User-" + Date.now();
    const userName = localStorage.getItem('userName') || "CM TaxHub Client";

    const options = {
        challenge: Uint8Array.from("CM-TAXHUB-SECURE-CHALLENGE", c => c.charCodeAt(0)),
        rp: { name: "CM TaxHub", id: window.location.hostname },
        user: {
            id: Uint8Array.from(userId, c => c.charCodeAt(0)),
            name: userName,
            displayName: userName
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        timeout: 60000,
        attestation: "none"
    };

    try {
        const credential = await navigator.credentials.create({ publicKey: options });
        localStorage.setItem('biometricCredentialId', bufferEncode(credential.rawId));
        localStorage.setItem('biometricsEnabled', 'true');
        alert("Biometrics successfully enabled!");
        return true;
    } catch (err) {
        console.error("Biometric setup failed:", err);
        return false;
    }
}

async function authenticateWithBiometrics() {
    const savedCredId = localStorage.getItem('biometricCredentialId');
    if (!savedCredId) return false;

    const options = {
        challenge: Uint8Array.from("CM-TAXHUB-SECURE-CHALLENGE", c => c.charCodeAt(0)),
        allowCredentials: [{ id: bufferDecode(savedCredId), type: 'public-key' }],
        timeout: 60000,
        userVerification: "required"
    };

    try {
        const assertion = await navigator.credentials.get({ publicKey: options });
        if (assertion) {
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = 'index.html';
            return true;
        }
    } catch (err) {
        console.error("Biometric verification failed:", err);
        return false;
    }
    return false;
}
