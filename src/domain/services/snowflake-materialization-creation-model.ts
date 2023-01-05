import citoSchema, { TableDefinition } from './cito-dw-schema';

export const citoSchemaNames = ['observability', 'lineage'] as const;
export type CitoSchemaName = typeof citoSchemaNames[number];

export const parseCitoSchemaName = (type: unknown): CitoSchemaName => {
  const identifiedType = citoSchemaNames.find(
    (element) => element === type
  );
  if (identifiedType) return identifiedType;
  throw new Error('Provision of invalid Cito schema name');
};

export const citoMaterializationNames = [
  'test_suites',
  'test_suites_custom',
  'test_history',
  'test_results',
  'test_alerts',
  'test_executions',
  'test_suites_qualitative',
  'test_history_qualitative',
  'test_results_qualitative',
  'test_alerts_qualitative',
  'test_executions_qualitative',
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
  const identifiedType = citoMaterializationNames.find(
    (element) => element === type
  );
  if (identifiedType) return identifiedType;
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
