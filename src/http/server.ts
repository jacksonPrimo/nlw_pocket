import fastify from "fastify";
import z from "zod";
import { createGoal } from "../functions/create-foal";
import {
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { GetWeekPendingGoalds } from "../functions/get-week-pending-goals";
import { createGoalCompletions } from "../functions/create-goal-completions";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.post(
	"/goals",
	{
		schema: {
			body: z.object({
				title: z.string(),
				desiredWeeklyFrequency: z.number().int().min(1).max(7),
			}),
		},
	},
	async (request) => {
		const { title, desiredWeeklyFrequency } = request.body;
		await createGoal({
			title: title,
			desiredWeeklyFrequency: desiredWeeklyFrequency,
		});
	},
);

app.post(
	"/create-goal-completation",
	{
		schema: {
			body: z.object({
				goalId: z.string(),
			}),
		},
	},
	async (request) => {
		const { goalId } = request.body;
		await createGoalCompletions({
			goalId,
		});
	},
);

app.get("/pending-goals", async (request) => {
	const { pendingGoals } = await GetWeekPendingGoalds();
	return pendingGoals;
});

app
	.listen({
		port: 3333,
	})
	.then(() => {
		console.log("server running");
	});
