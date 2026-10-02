import { getCached } from "./api";
import type { GoalAnalysis, GoalEvent } from "@/types/goals";

export const fetchGoals = (id: number) => getCached<GoalEvent[]>(`/matches/${id}/goals`);

export const fetchGoalAnalysis = (id: number, goalId: number) =>
  getCached<GoalAnalysis>(`/matches/${id}/goals/${goalId}/analysis`);