import dayjs from "dayjs";
import { client, db } from ".";
import { goalCompletations, goals } from "./schema";

async function seed() {
	await db.delete(goalCompletations);
	await db.delete(goals);

	const result = await db
		.insert(goals)
		.values([
			{ title: "Academia", desiredWeeklyFrequency: 6 },
			{ title: "Estudar inglês", desiredWeeklyFrequency: 5 },
			{ title: "Estudar uma tecnologia nova", desiredWeeklyFrequency: 3 },
		])
		.returning();

	const startOfWeek = dayjs().startOf("week");

	await db.insert(goalCompletations).values([
		{ goalId: result[0].id, createdAt: startOfWeek.toDate() },
		{ goalId: result[1].id, createdAt: startOfWeek.add(1, "day").toDate() },
	]);
}

seed().finally(() => {
	client.end();
});
