import { executeCommand } from "../utils/executeCommand";
import bodyParser from "body-parser";
import express from "express";

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post("/github-webhook", (req, res) => {
	const { body } = req;

	if (body && body.ref && body.ref.startsWith("refs/heads/")) {
		const branch = body.ref.split("/").pop();
		console.log(`Received push event for branch ${branch}`);

		const buildCommand = `git checkout ${branch} && npm install && npm run build`;
		executeCommand(buildCommand)
			.then(() => {
				console.log(`Build successful for branch ${branch}`);
				res.status(200).send("Build successful");
			})
			.catch((error) => {
				console.error(`Error building branch ${branch}: ${error.message}`);
				res.status(500).send("Build failed");
			});
	} else {
		console.log("Received event that is not a push event");
		res.status(400).send("Not a push event");
	}
});

app.listen(port, () => {
	console.log("Server listening at port", port);
});
