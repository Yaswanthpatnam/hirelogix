import api from "../utils/api";


/*
 * Return the current user's Gmail connection state.
 */
export async function getGmailConnectionStatus() {
  const response =
    await api.get(
      "/gmail/status/"
    );

  return response.data;
}


/*
 * Start the separate Gmail authorization flow.
 */
export async function startGmailAuthorization() {
  const response =
    await api.get(
      "/gmail/auth/start/"
    );

  return response.data;
}


/*
 * Start/continue the first historical Gmail scan.
 *
 * The backend determines the search scope. No date is required.
 */
export async function syncHistoricalGmail() {
  const response =
    await api.post(
      "/gmail/sync/historical/"
    );

  return response.data;
}


/*
 * Check Gmail for changes since the stored History API checkpoint.
 */
export async function syncIncrementalGmail() {
  const response =
    await api.post(
      "/gmail/sync/incremental/"
    );

  return response.data;
}
