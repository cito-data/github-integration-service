const schema = {
  tables: [
    {
      name: 'test_suites',
      columns: [
        { name: 'id', type: 'string' },
        { name: 'test_type', type: 'string' },
        { name: 'activated', type: 'boolean' },
        { name: 'threshold', type: 'integer' },
        { name: 'execution_frequency', type: 'integer' },
        { name: 'database_name', type: 'string' },
        { name: 'schema_name', type: 'string' },
        { name: 'materialization_name', type: 'string' },
        { name: 'materialization_type', type: 'string' },
        { name: 'column_name', type: 'string' },
        { name: 'target_resource_id', type: 'string' },
        { name: 'organization_id', type: 'string' },
        { name: 'cron', type: 'string' },
        {name: 'execution_type', type: 'string'}
      ],
    },
    {
      name: 'test_suites_custom',
      columns: [
        { name: 'id', type: 'string' },
        { name: 'activated', type: 'boolean' },
        { name: 'threshold', type: 'integer' },
        { name: 'execution_frequency', type: 'integer' },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'sql_logic', type: 'string' },
        { name: 'target_resource_ids', type: 'array' },
        { name: 'organization_id', type: 'string' },
        { name: 'cron', type: 'string' },
        {name: 'execution_type', type: 'string'}
      ],
    },
    {
      name: 'test_history',
      columns: [
        { name: 'id', type: 'string' },
        { name: 'test_type', type: 'string' },
        { name: 'value', type: 'float' },
        { name: 'is_anomaly', type: 'boolean' },
        { name: 'user_feedback_is_anomaly', type: 'integer' },
        { name: 'test_suite_id', type: 'string' },
        { name: 'execution_id', type: 'string' },
        { name: 'alert_id', type: 'string' },
      ],
    },
    {
      name: 'test_results',
      columns: [
        { name: 'id', type: 'string' },
        { name: 'test_type', type: 'string' },
        { name: 'mean_ad', type: 'float' },
        { name: 'median_ad', type: 'float' },
        { name: 'modified_z_score', type: 'float' },
        { name: 'expected_value', type: 'float' },
        { name: 'expected_value_upper_bound', type: 'float' },
        { name: 'expected_value_lower_bound', type: 'float' },
        { name: 'deviation', type: 'float' },
        { name: 'is_anomalous', type: 'boolean' },
        { name: 'test_suite_id', type: 'string' },
        { name: 'execution_id', type: 'string' },
      ],
    },
    {
      name: 'test_executions',
      columns: [
        { name: 'id', type: 'string' },
        { name: 'executed_on', type: 'timestamp_ntz' },
        { name: 'test_suite_id', type: 'string' },
      ],
    },    
    {
      name: 'test_alerts',
      columns: [
        { name: 'id', type: 'string' },
        { name: 'test_type', type: 'string' },
        { name: 'message', type: 'string' },
        { name: 'test_suite_id', type: 'string' },
        { name: 'execution_id', type: 'string' },
      ],
    },
    {
      name: 'test_suites_nominal',
      columns: [
        { name: 'id', type: 'string' },
        { name: 'test_type', type: 'string' },
        { name: 'activated', type: 'boolean' },
        { name: 'execution_frequency', type: 'integer' },
        { name: 'database_name', type: 'string' },
        { name: 'schema_name', type: 'string' },
        { name: 'materialization_name', type: 'string' },
        { name: 'materialization_type', type: 'string' },
        { name: 'column_name', type: 'string' },
        { name: 'target_resource_id', type: 'string' },
        { name: 'organization_id', type: 'string' },
        { name: 'cron', type: 'string' },
        {name: 'execution_type', type: 'string'}
      ],
    },
    {
      name: 'test_history_nominal',
      columns: [
        { name: 'id', type: 'string' },
        { name: 'test_type', type: 'string' },
        { name: 'value', type: 'string' },
        { name: 'is_identical', type: 'boolean' },
        { name: 'test_suite_id', type: 'string' },
        { name: 'execution_id', type: 'string' },
        { name: 'alert_id', type: 'string' },
      ],
    },
    {
      name: 'test_results_nominal',
      columns: [
        { name: 'id', type: 'string' },
        { name: 'test_type', type: 'string' },
        { name: 'expected_value', type: 'string' },
        { name: 'deviation', type: 'string' },
        { name: 'is_identical', type: 'boolean' },
        { name: 'test_suite_id', type: 'string' },
        { name: 'execution_id', type: 'string' },
      ],
    },
    {
      name: 'test_executions_nominal',
      columns: [
        { name: 'id', type: 'string' },
        { name: 'executed_on', type: 'timestamp_ntz' },
        { name: 'test_suite_id', type: 'string' },
      ],
    },    
    {
      name: 'test_alerts_nominal',
      columns: [
        { name: 'id', type: 'string' },
        { name: 'test_type', type: 'string' },
        { name: 'message', type: 'string' },
        { name: 'test_suite_id', type: 'string' },
        { name: 'execution_id', type: 'string' },
      ],
    },

  ],
};

export default schema;
