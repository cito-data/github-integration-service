import { LineageDto } from "./lineage-dto";

export interface PostLineagePayload {
  catalog: string,
  manifest: string,
  targetOrganizationId: string
}

export interface ILineageApiRepo {
  post(payload: PostLineagePayload, jwt: string): Promise<LineageDto>;
}