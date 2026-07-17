/** Canonical agent contract shared by local stdio MCP and hosted HTTP MCP. */
export const MCP_LIFECYCLE_TOOLS = [
  "list_brands", "compile_brand", "get_brand", "list_recipes", "save_recipe", "rename_recipe", "delete_recipe",
  "list_templates", "list_template_families", "list_template_family_versions", "duplicate_template_family",
  "preflight_template_family", "publish_template_family", "archive_template_family", "diff_brand_spec",
  "plan_campaign", "list_content_programs", "preview_content_program", "create_content_program",
  "run_content_program", "pause_content_program", "delete_content_program", "start_campaign_run",
  "list_agent_runs", "get_agent_run", "retry_agent_run", "complete_agent_run",
  "cancel_agent_run", "render_assets", "list_renders", "get_render", "list_channels", "list_campaigns",
  "create_campaign", "update_campaign", "create_review_batch", "get_review_status", "add_review_comment",
  "schedule_post", "cancel_post", "list_calendar", "get_analytics", "get_usage",
  "get_audit_log",
] as const;

export type McpLifecycleTool = (typeof MCP_LIFECYCLE_TOOLS)[number];
