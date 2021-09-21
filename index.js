/* eslint-disable no-tabs*/
/* eslint-disable no-undef*/
/* eslint-disable object-curly-spacing*/
/* eslint-disable indent*/
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const sgMail = require("@sendgrid/mail");

const API_KEY = functions.config().sendgrid.key;
const TEMPLATE_ID = functions.config().sendgrid.template;

sgMail.setApiKey(API_KEY);

exports.welcomeEmail = functions.auth.user().onCreate((user) => {
	const msg = {
		to: user.email,
		from: "devops@seguridata.com",
		template_id: TEMPLATE_ID,
		dynamic_template_data: {
			subject: user.displayName,
			text: "Bienvenido",
		},
	};
	return sgMail.send(msg);
});

exports.signedDocEmail = functions.https.onCall(async (data, context) => {
	if (!context.auth && !context.auth.token.email) {
		throw new functions.https.HttpsError("failed-precondition",
			"Must be logged in");
	}

	const msg = {
		to: context.auth.token.email,
		from: "devops@seguridata.com",
		template_id: TEMPLATE_ID,
		dynamic_template_data: {
			subject: context.auth.token.email,
			text: "Documento firmado",
		},
	};
	await sgMail.send(msg);

	return { success: true };
});

exports.scheduledAlert = functions.pubsub.schedule("0 12 * * *").onRun(async (context) => {
	const nowDate = new Date();
	const snapshot = await firebase.firestore().collection("alertas").get();
	snapshot.docs.forEach(alarm => {
		let sendEmail = alarm.type === "daily";

		if (alarm.type === "weekly") {
			let daysDifference;
			const elapsedTime = (nowDate.getTime() - alarm.time);
			daysDifference = Math.floor(elapsedTime / 1000 / 60 / 60 / 24);
			sendEmail = daysDifference === 7;
		}
		console.log(sendEmail, nowDate);

		if (sendEmail) {
			alarm.emails.forEach(async (email) => {
				const msg = {
					to: email,
					from: "devops@seguridata.com",
					template_id: TEMPLATE_ID,
					dynamic_template_data: {
						subject: context.auth.token.email,
						text: alarm.message,
					},
				};
				await sgMail.send(msg);
			})
		}

	});
	return null;
});

exports.addAlert = functions.https.onCall((data, context) => {

});




// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
