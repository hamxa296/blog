/**
 * submissions.js
 * This file contains functions for handling form submissions,
 * like the contact form, and saving them to Firestore.
 */

/*
    FIRESTORE DATABASE STRUCTURE for the 'submissions' collection:

    Each document in this collection will represent a single contact form entry.
    - name (string): The full name of the person submitting the form.
    - email (string): The email address of the person.
    - subject (string): The subject selected from the dropdown.
    - message (string): The content of the message.
    - submittedAt (timestamp): The date and time the form was submitted.
    - submittedBy (string, optional): The UID of the user if they were logged in.
*/

/**
 * Saves a contact form submission to the Firestore database.
 * @param {object} submissionData - An object containing the name, email, subject, and message.
 * @returns {Promise<object>} A promise that resolves on success or returns an error object on failure.
 */
async function saveContactSubmission(submissionData) {
    try {
        const user = auth.currentUser; // Check if a user is logged in

        const newSubmission = {
            name: submissionData.name,
            email: submissionData.email,
            subject: submissionData.subject,
            message: submissionData.message,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
            // Add the user's ID if they are logged in for context
            submittedBy: user ? user.uid : "Guest"
        };

        await db.collection("submissions").add(newSubmission);
        console.log("Contact form submission saved successfully.");
        return { success: true };

    } catch (error) {
        console.error("Error saving submission:", error);
        return { success: false, error: "Failed to send message." };
    }
}
