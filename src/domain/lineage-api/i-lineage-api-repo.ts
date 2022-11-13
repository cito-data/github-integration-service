import { LineageDto } from "./lineage-dto";

export interface PostLineagePayload {
  catalog: string,
  manifest: string,
  targetOrgId: string
}

export interface ILineageApiRepo {
  post(payload: PostLineagePayload, jwt: string): Promise<LineageDto>;
}