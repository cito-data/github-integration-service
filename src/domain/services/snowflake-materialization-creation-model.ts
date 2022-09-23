import citoSchema from './cito-dw-schema';

export const citoMaterializationTypes = [
  'test_suites',
  'test_suites_custom',
  'test_history',
  'test_results',
  'test_alerts',
  'test_executions',
  'test_suites_nominal',
  'test_history_nominal',
  'test_results_nominal',
  'test_alerts_nominal',
  'test_executions_nominal',
] as const;
export type CitoMaterializationType = typeof citoMaterializationTypes[number];

export const parseCitoMaterializationType = (
  citoMaterializationType: unknown
): CitoMaterializationType => {
  const identifiedFrequency = citoMaterializationTypes.find(
    (element) => element === citoMaterializationType
  );
  if (identifiedFrequency) return identifiedFrequency;
  throw new Error('Provision of invalid Cito materialization type');
};

const getCitoMaterializationSchema = (
  citoMaterializationType: CitoMaterializationType
): { [key: string]: any } => {
  const { tables } = citoSchema;
  const matchingTables = tables.filter(
    (el: any) => el.name === citoMaterializationType
  );
  if (matchingTables.length !== 1)
    throw new Error('More than one or no potential schema found');
  return matchingTables[0];
};

export const getCreateTableQuery = (
  citoMaterializationType: CitoMaterializationType
): string => {
  const schema = getCitoMaterializationSchema(citoMaterializationType);
  const columnDefinitionString = schema.columns
    .map((el: any) => `${el.name} ${el.type}`)
    .join(', ');
   
  return `
    create table if not exists cito.public.${citoMaterializationType} 
      ${`(${columnDefinitionString})`};
    `;
};
