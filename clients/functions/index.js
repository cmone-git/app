const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { google } = require("googleapis");

admin.initializeApp();

/**
 * Runs every day at 02:30 Asia/Kolkata.
 * Creates a managed Firestore export in the Firebase Storage bucket.
 * The dated prefix keeps each daily snapshot separate for recovery.
 */
exports.dailyFirestoreBackup = onSchedule(
  {
    schedule: "30 2 * * *",
    timeZone: "Asia/Kolkata",
    timeoutSeconds: 540,
    memory: "512MiB",
    region: "asia-south1"
  },
  async () => {
    const projectId = process.env.GCLOUD_PROJECT;
    const bucket = admin.storage().bucket().name;
    const now = new Date();
    const stamp = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);

    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/datastore"]
    });

    const firestore = google.firestore({ version: "v1", auth });
    const database = `projects/${projectId}/databases/(default)`;
    const outputUriPrefix = `gs://${bucket}/_backups/firestore/${stamp}`;

    const response = await firestore.projects.databases.exportDocuments({
      name: database,
      requestBody: { outputUriPrefix }
    });

    logger.info("Daily Firestore backup started", {
      projectId,
      outputUriPrefix,
      operation: response.data.name || null
    });
  }
);
