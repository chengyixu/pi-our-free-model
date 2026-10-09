# Security

Do not use public free pools for secrets, personal data or sensitive source code. Model responses and tool requests are untrusted; apply your normal Pi permission policy before consequential actions.

Please report credential leaks or execution-boundary defects privately through GitHub's private vulnerability reporting where enabled. Do not attach auth.json or complete Pi session files to public issues.

This extension loads with Pi's user permissions. Read its source before installing. It contacts only the selected model upstream for inference/catalogs, has no telemetry or local gateway, and does not impersonate another client. Pi handles credentials, persistent sessions and package updates.
