export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  schemaName: string;
}

export interface Schema {
  tables: TableDefinition[];
}

// todo - fix nullable settings for observability columns (all set to true rn)
export const schema: Schema = {
  tables: [
    {
      name: 'test_suites',
      columns: [
        { name: 'id', type: 'string', nullable: true },
        { name: 'test_type', type: 'string', nullable: true },
        { name: 'activated', type: 'boolean', nullable: true },
        { name: 'threshold', type: 'integer', nullable: true },
        { name: 'execution_frequency', type: 'integer', nullable: true },
        { name: 'database_name', type: 'string', nullable: true },
        { name: 'schema_name', type: 'string', nullable: true },
        { name: 'materialization_name', type: 'string', nullable: true },
        { name: 'materialization_type', type: 'string', nullable: true },
        { name: 'column_name', type: 'string', nullable: true },
        { name: 'target_resource_id', type: 'string', nullable: true },
        { name: 'organization_id', type: 'string', nullable: true },
        { name: 'cron', type: 'string', nullable: true },
        { name: 'execution_type', type: 'string', nullable: true },
      ],
      schemaName: 'observability',
    },
    {
      name: 'test_suites_custom',
      columns: [
        { name: 'id', type: 'string', nullable: true },
        { name: 'activated', type: 'boolean', nullable: true },
        { name: 'threshold', type: 'integer', nullable: true },
        { name: 'execution_frequency', type: 'integer', nullable: true },
        { name: 'name', type: 'string', nullable: true },
        { name: 'description', type: 'string', nullable: true },
        { name: 'sql_logic', type: 'string', nullable: true },
        { name: 'target_resource_ids', type: 'array', nullable: true },
        { name: 'organization_id', type: 'string', nullable: true },
        { name: 'cron', type: 'string', nullable: true },
        { name: 'execution_type', type: 'string', nullable: true },
      ],
      schemaName: 'observability',
    },
    {
      name: 'test_history',
      columns: [
        { name: 'id', type: 'string', nullable: true },
        { name: 'test_type', type: 'string', nullable: true },
        { name: 'value', type: 'float', nullable: true },
        { name: 'is_anomaly', type: 'boolean', nullable: true },
        { name: 'user_feedback_is_anomaly', type: 'integer', nullable: true },
        { name: 'test_suite_id', type: 'string', nullable: true },
        { name: 'execution_id', type: 'string', nullable: true },
        { name: 'alert_id', type: 'string', nullable: true },
      ],
      schemaName: 'observability',
    },
    {
      name: 'test_results',
      columns: [
        { name: 'id', type: 'string', nullable: true },
        { name: 'test_type', type: 'string', nullable: true },
        { name: 'mean_ad', type: 'float', nullable: true },
        { name: 'median_ad', type: 'float', nullable: true },
        { name: 'modified_z_score', type: 'float', nullable: true },
        { name: 'expected_value', type: 'float', nullable: true },
        { name: 'expected_value_upper_bound', type: 'float', nullable: true },
        { name: 'expected_value_lower_bound', type: 'float', nullable: true },
        { name: 'deviation', type: 'float', nullable: true },
        { name: 'is_anomalous', type: 'boolean', nullable: true },
        { name: 'test_suite_id', type: 'string', nullable: true },
        { name: 'execution_id', type: 'string', nullable: true },
      ],
      schemaName: 'observability',
    },
    {
      name: 'test_executions',
      columns: [
        { name: 'id', type: 'string', nullable: true },
        { name: 'executed_on', type: 'timestamp_ntz', nullable: true },
        { name: 'test_suite_id', type: 'string', nullable: true },
      ],
      schemaName: 'observability',
    },
    {
      name: 'test_alerts',
      columns: [
        { name: 'id', type: 'string', nullable: true },
        { name: 'test_type', type: 'string', nullable: true },
        { name: 'message', type: 'string', nullable: true },
        { name: 'test_suite_id', type: 'string', nullable: true },
        { name: 'execution_id', type: 'string', nullable: true },
      ],
      schemaName: 'observability',
    },
    {
      name: 'test_suites_nominal',
      columns: [
        { name: 'id', type: 'string', nullable: true },
        { name: 'test_type', type: 'string', nullable: true },
        { name: 'activated', type: 'boolean', nullable: true },
        { name: 'execution_frequency', type: 'integer', nullable: true },
        { name: 'database_name', type: 'string', nullable: true },
        { name: 'schema_name', type: 'string', nullable: true },
        { name: 'materialization_name', type: 'string', nullable: true },
        { name: 'materialization_type', type: 'string', nullable: true },
        { name: 'column_name', type: 'string', nullable: true },
        { name: 'target_resource_id', type: 'string', nullable: true },
        { name: 'organization_id', type: 'string', nullable: true },
        { name: 'cron', type: 'string', nullable: true },
        { name: 'execution_type', type: 'string', nullable: true },
      ],
      schemaName: 'observability',
    },
    {
      name: 'test_history_nominal',
      columns: [
        { name: 'id', type: 'string', nullable: true },
        { name: 'test_type', type: 'string', nullable: true },
        { name: 'value', type: 'string', nullable: true },
        { name: 'is_identical', type: 'boolean', nullable: true },
        { name: 'test_suite_id', type: 'string', nullable: true },
        { name: 'execution_id', type: 'string', nullable: true },
        { name: 'alert_id', type: 'string', nullable: true },
      ],
      schemaName: 'observability',
    },
    {
      name: 'test_results_nominal',
      columns: [
        { name: 'id', type: 'string', nullable: true },
        { name: 'test_type', type: 'string', nullable: true },
        { name: 'expected_value', type: 'string', nullable: true },
        { name: 'deviation', type: 'string', nullable: true },
        { name: 'is_identical', type: 'boolean', nullable: true },
        { name: 'test_suite_id', type: 'string', nullable: true },
        { name: 'execution_id', type: 'string', nullable: true },
      ],
      schemaName: 'observability',
    },
    {
      name: 'test_executions_nominal',
      columns: [
        { name: 'id', type: 'string', nullable: true },
        { name: 'executed_on', type: 'timestamp_ntz', nullable: true },
        { name: 'test_suite_id', type: 'string', nullable: true },
      ],
      schemaName: 'observability',
    },
    {
      name: 'test_alerts_nominal',
      columns: [
        { name: 'id', type: 'string', nullable: true },
        { name: 'test_type', type: 'string', nullable: true },
        { name: 'message', type: 'string', nullable: true },
        { name: 'test_suite_id', type: 'string', nullable: true },
        { name: 'execution_id', type: 'string', nullable: true },
      ],
      schemaName: 'observability',
    },
    {
      name: 'lineage_snapshots',
      columns: [
        { name: 'id', type: 'string', nullable: false },
        { name: 'created_at', type: 'timestamp_ntz', nullable: false },
        { name: 'completed', type: 'boolean', nullable: false },
        { name: 'db_covered_names', type: 'array', nullable: false },
        { name: 'diff', type: 'string', nullable: true },
      ],
      schemaName: 'lineage',
    },
    {
      name: 'columns',
      columns: [
        { name: 'id', type: 'string', nullable: false },
        { name: 'name', type: 'string', nullable: false },
        { name: 'relation_name', type: 'string', nullable: false },
        { name: 'index', type: 'string', nullable: false },
        { name: 'data_type', type: 'string', nullable: false },
        { name: 'is_identity', type: 'boolean', nullable: true },
        { name: 'is_nullable', type: 'boolean', nullable: true },
        { name: 'materialization_id', type: 'string', nullable: false },
        { name: 'comment', type: 'string', nullable: true },
      ],
      schemaName: 'lineage',
    },
    {
      name: 'materializations',
      columns: [
        { name: 'id', type: 'string', nullable: false },
        { name: 'name', type: 'string', nullable: false },
        { name: 'schema_name', type: 'string', nullable: false },
        { name: 'database_name', type: 'string', nullable: false },
        { name: 'relation_name', type: 'string', nullable: false },
        { name: 'type', type: 'string', nullable: false },
        { name: 'is_transient', type: 'boolean', nullable: true },
        { name: 'logic_id', type: 'string', nullable: true },
        { name: 'owner_id', type: 'string', nullable: true },
        { name: 'comment', type: 'string', nullable: true },
      ],
      schemaName: 'lineage',
    },
    {
      name: 'logics',
      columns: [
        { name: 'id', type: 'string', nullable: false },
        { name: 'relation_name', type: 'string', nullable: false },
        { name: 'sql', type: 'string', nullable: false },
        { name: 'dependent_on', type: 'object', nullable: false },
        { name: 'parsed_logic', type: 'string', nullable: false },
        { name: 'statement_refs', type: 'object', nullable: false },
      ],
      schemaName: 'lineage',
    },
    {
      name: 'dependencies',
      columns: [
        { name: 'id', type: 'string', nullable: false },
        { name: 'type', type: 'string', nullable: false },
        { name: 'head_id', type: 'string', nullable: false },
        { name: 'tail_id', type: 'string', nullable: false },
      ],
      schemaName: 'lineage',
    },
    {
      name: 'dashboards',
      columns: [
        { name: 'id', type: 'string', nullable: false },
        { name: 'name', type: 'string', nullable: true },
        { name: 'url', type: 'string', nullable: true },
        { name: 'materialization_name', type: 'string', nullable: false },
        { name: 'materialization_id', type: 'string', nullable: false },
        { name: 'column_name', type: 'string', nullable: false },
        { name: 'column_id', type: 'string', nullable: false },
      ],
      schemaName: 'lineage',
    },
  ],
};

export default schema;
