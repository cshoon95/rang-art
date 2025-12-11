export type PlanningType = "normal" | "special" | "temporary";

export interface PlanningRow {
  id: number;
  academy_code: string;
  year: number;
  month: number;
  type: PlanningType;
  title: string;
  content: string;
  image_url: string | null;
  register_id: string;
  created_at: string;
}

export interface PlanningParams {
  year: number;
  month: number;
  type: PlanningType;
  academyCode: string;
}
