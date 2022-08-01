import citoSchema from './cito-dw-schema';

export const citoMaterializationTypes = [
  'tests',
  'test_history',
  'test_results',
  'alerts',
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
