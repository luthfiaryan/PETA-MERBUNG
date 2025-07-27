const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;

/**
 * @typedef {object} Complaint
 * @property {"UMKM" | "Fasilitas Umum" | "Administrasi"} complaintCategory - The category of the complaint.
 * @property {string?} name - The name of the person making the complaint.
 * @property {string?} phoneNumber - The phone number of the person making the complaint.
 * @property {string?} email - The email address of the person making the complaint.
 * @property {string} complainee - The name of the party being complained about.
 * @property {string} subject - The subject of the complaint.
 * @property {string} complaintText - The text of the complaint.
 */

/**
 *
 * @param {Complaint} complaintObject
 */
export async function sendComplaint(complaintObject) {
  try {
    const res = await fetch(SCRIPT_URL, {
      headers: {
        accept: "text/plain",
        "Content-Type": "text/plain;charset=utf-8",
      },
      redirect: "follow",
      method: "POST",
      body: JSON.stringify(complaintObject),
    });
    return res.ok;
  } catch (error) {
    console.error("Error sending complaint:", error);
    return false;
  }
}
