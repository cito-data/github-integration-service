import citoSchema, { TableDefinition } from './cito-dw-schema';

export const citoSchemaNames = ['observability', 'lineage'] as const;
export type CitoSchemaName = typeof citoSchemaNames[number];

export const parseCitoSchemaName = (type: unknown): CitoSchemaName => {
  const identifiedFrequency = citoSchemaNames.find(
    (element) => element === type
  );
  if (identifiedFrequency) return identifiedFrequency;
  throw new Error('Provision of invalid Cito schema name');
};

export const citoMaterializationNames = [
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
  'lineage_snapshots',
  'logics',
  'materializations',
  'columns',
  'dependencies',
  'dashboards',
] as const;
export type CitoMaterializationName = typeof citoMaterializationNames[number];

export const parseCitoMaterializationName = (
  type: unknown
): CitoMaterializationName => {
  const identifiedFrequency = citoMaterializationNames.find(
    (element) => element === type
  );
  if (identifiedFrequency) return identifiedFrequency;
  throw new Error('Provision of invalid Cito materialization name');
};

const getCitoMaterializationSchema = (
  citoMaterializationType: CitoMaterializationName
): TableDefinition => {
  const { tables } = citoSchema;
  const matchingTables = tables.filter(
    (el) => el.name === citoMaterializationType
  );
  if (matchingTables.length !== 1)
    throw new Error('More than one or no potential schema found');
  return matchingTables[0];
};

export const getCreateTableQuery = (
  citoMaterializationType: CitoMaterializationName
): string => {
  const schema = getCitoMaterializationSchema(citoMaterializationType);
  const columnDefinitionString = schema.columns
    .map((el) => `${el.name} ${el.type} ${el.nullable? '': 'not null'}`)
    .join(', ');

  return `
    create table if not exists cito.${
      schema.schemaName
    }.${citoMaterializationType} 
      ${`(${columnDefinitionString})`};
    `;
};

export const getCreateDbSchemaQuery = (schemaName: CitoSchemaName): string =>
  `create schema if not exists cito.${schemaName}`;
