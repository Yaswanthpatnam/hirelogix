import api from "../utils/api";


/*
 * Check whether the current HireLogix user
 * already has an active Gmail connection.
 */
export async function getGmailConnectionStatus() {

  const response =
    await api.get(
      "/gmail/status/"
    );


  return response.data;

}


/*
 * Start the Gmail OAuth flow.
 *
 * Django creates the Google authorization URL.
 * The browser redirect itself is handled by
 * Permission.jsx.
 */
export async function startGmailAuthorization() {

  const response =
    await api.get(
      "/gmail/auth/start/"
    );


  return response.data;

}


/*
 * Check Gmail for messages added since the
 * previous Gmail History API checkpoint.
 */
export async function syncIncrementalGmail() {

  const response =
    await api.post(
      "/gmail/sync/incremental/"
    );


  return response.data;

}