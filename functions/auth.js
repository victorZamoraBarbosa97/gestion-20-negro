// functions/auth.js
// Verificación de identidad para getTotalAmount: exige un ID token de Firebase
// (incluso anónimo) para bloquear llamadas directas a la URL pública, y resuelve
// el "tier" del usuario (guest/user/admin) para aplicar límites de uso distintos.

import { initializeApp, applicationDefault, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { existsSync } from "fs";
import { AuthenticationError, AuthorizationError } from "./validation.js";

const KEY_FILENAME = "service-account-key.json";
const isProduction = !existsSync(KEY_FILENAME);

function ensureAdminApp() {
  if (getApps().length === 0) {
    initializeApp({
      credential: isProduction ? applicationDefault() : cert(KEY_FILENAME),
    });
  }
}

/**
 * Verifica el header "Authorization: Bearer <idToken>" contra Firebase Auth.
 * Acepta tokens de usuarios anónimos (invitados de la demo) y de Google.
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>}
 */
export async function verifyAuthHeader(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw new AuthenticationError(
      'Falta el header "Authorization: Bearer <idToken>"',
    );
  }

  const idToken = authorizationHeader.slice("Bearer ".length).trim();
  if (!idToken) {
    throw new AuthenticationError("El token de autenticación está vacío");
  }

  ensureAdminApp();

  try {
    return await getAuth().verifyIdToken(idToken);
  } catch {
    throw new AuthenticationError("Token de autenticación inválido o expirado");
  }
}

function isAnonymousToken(decodedToken) {
  return decodedToken.firebase?.sign_in_provider === "anonymous";
}

/**
 * Determina el tier de límites (guest/user/admin) para un token ya verificado.
 * - Invitados anónimos -> "guest" (límite bajo, es la demo pública).
 * - Usuarios de Google en la allowlist -> "user" o "admin" según su rol.
 * - Usuarios de Google NO listados -> rechazados (no deberían llegar aquí,
 *   el frontend ya los desloguea, pero por si alguien llama la función directo).
 * @param {import('@google-cloud/firestore').Firestore} firestore
 */
export async function resolveUserTier(decodedToken, firestore) {
  if (isAnonymousToken(decodedToken)) {
    return "guest";
  }

  const email = decodedToken.email;
  if (!email) {
    return "guest";
  }

  const allowlistSnap = await firestore.doc(`allowlist/${email}`).get();
  if (!allowlistSnap.exists) {
    throw new AuthorizationError(`El usuario ${email} no está autorizado`);
  }

  return allowlistSnap.data().role === "admin" ? "admin" : "user";
}
