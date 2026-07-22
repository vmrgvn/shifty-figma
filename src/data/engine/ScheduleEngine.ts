import type { GeneratedSchedule, GenerationRequest } from "../../domain/schedule/types";

export interface ScheduleEngine {
  generate(request: GenerationRequest): Promise<GeneratedSchedule>;
}
