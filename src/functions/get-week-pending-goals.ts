import dayjs from "dayjs";
import { db } from "../db";
import { goalCompletations, goals } from "../db/schema";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";

export async function GetWeekPendingGoalds() {
	const firstDayOfweek = dayjs().startOf("week").toDate();
	const lastDayOfweek = dayjs().endOf("week").toDate();

	//common table expressions
	const goalsCreatedUpToWeek = db.$with("goals_created_up_to_week").as(
		db
			.select({
				id: goals.id,
				title: goals.title,
				desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
				createdAt: goals.createdAt,
			})
			.from(goals)
			.where(lte(goals.createdAt, lastDayOfweek)),
	);

	const goalCompletionsCount = db.$with("goal_completions_counts").as(
		db
			.select({
				goalId: goalCompletations.goalId,
				completationsCount: count().as("completationsCount"),
			})
			.from(goalCompletations)
			.where(
				and(
					gte(goalCompletations.createdAt, firstDayOfweek),
					lte(goalCompletations.createdAt, lastDayOfweek),
				),
			)
			.groupBy(goalCompletations.goalId),
	);

	const pendingGoals = await db
		.with(goalsCreatedUpToWeek, goalCompletionsCount)
		.select({
			id: goalsCreatedUpToWeek.id,
			title: goalsCreatedUpToWeek.title,
			desiredWeeklyFrequency: goalsCreatedUpToWeek.desiredWeeklyFrequency,
			completationsCount: sql`
				COALESCE(${goalCompletionsCount.completationsCount}, 0)
			`.mapWith(Number),
		})
		.from(goalsCreatedUpToWeek)
		.leftJoin(
			goalCompletionsCount,
			eq(goalCompletionsCount.goalId, goalsCreatedUpToWeek.id),
		);

	return { pendingGoals };
}
