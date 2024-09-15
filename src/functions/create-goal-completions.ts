import dayjs from "dayjs";
import { db } from "../db";
import { goalCompletations, goals } from "../db/schema";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";

interface CreateGoalCompletionsRequest {
	goalId: string;
}

export async function createGoalCompletions({
	goalId,
}: CreateGoalCompletionsRequest) {
	const firstDayOfweek = dayjs().startOf("week").toDate();
	console.log(firstDayOfweek);
	const lastDayOfweek = dayjs().endOf("week").toDate();
	console.log(lastDayOfweek);

	const goalCompletionCounts = db.$with("goal_completion_counts").as(
		db
			.select({
				goalId: goalCompletations.goalId,
				completionCount: count(goalCompletations.id).as("completionCount"),
			})
			.from(goalCompletations)
			.where(
				and(
					gte(goalCompletations.createdAt, firstDayOfweek),
					lte(goalCompletations.createdAt, lastDayOfweek),
					eq(goalCompletations.goalId, goalId),
				),
			)
			.groupBy(goalCompletations.goalId),
	);

	const result = await db
		.with(goalCompletionCounts)
		.select({
			desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
			completionCount: sql`
        COALESCE(${goalCompletionCounts.completionCount}, 0)
      `.mapWith(Number),
		})
		.from(goals)
		.leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goals.id))
		.where(eq(goals.id, goalId))
		.limit(1);

	const { completionCount, desiredWeeklyFrequency } = result[0];
	console.log("aaaaaa", result[0]);
	if (completionCount >= desiredWeeklyFrequency) {
		throw new Error("Goal already completed this week");
	}

	const resultCreate = await db
		.insert(goalCompletations)
		.values({ goalId })
		.returning();

	const goalCompletation = resultCreate[0];

	return {
		goalCompletation,
	};
}
