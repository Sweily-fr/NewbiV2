/**
 * Notification push vers l'app mobile Newbi (Expo) d'un utilisateur, à
 * partir des jetons enregistrés sur son compte. Non bloquante : une erreur
 * est journalisée, jamais remontée.
 *
 * @param {import("mongodb").Db} mongoDb
 * @param {import("mongodb").ObjectId} userId
 * @param {{ title: string, body: string, data?: object }} message
 */
export async function sendPushToUser(
  mongoDb,
  userId,
  { title, body, data = {} },
) {
  try {
    const user = await mongoDb
      .collection("user")
      .findOne({ _id: userId }, { projection: { expoPushTokens: 1 } });
    const tokens = (user?.expoPushTokens || [])
      .map((t) => t?.token)
      .filter(
        (t) => typeof t === "string" && t.startsWith("ExponentPushToken"),
      );
    if (tokens.length === 0) return;

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          sound: "default",
          title,
          body,
          data,
          priority: "high",
          channelId: "default",
        })),
      ),
    });
  } catch (error) {
    console.error("[PUSH] Envoi impossible:", error?.message || error);
  }
}
