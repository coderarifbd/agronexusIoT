export const passkeySessions = new Map();

export async function verifyMasterPasskey(req, res, next) {
  // Master passkey gate removed — allow access directly
  return next();
}
