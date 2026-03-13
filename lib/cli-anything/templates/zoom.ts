/**
 * cli-anything/templates/zoom.ts — Zoom-specific template overrides.
 *
 * Provides Zoom-specific API surface and backend methods using
 * the Zoom REST API v2 via urllib.request with JWT/OAuth authentication.
 */

import type { ApiEndpoint } from "../types.js";

export const ZOOM_API_SURFACE: ApiEndpoint[] = [
  // Meeting
  { name: "meeting-create", description: "Create a new Zoom meeting", args: [
    { name: "topic", type: "string", required: true, description: "Meeting topic/title" },
    { name: "start-time", type: "string", required: false, description: "Start time in ISO 8601 format" },
    { name: "duration", type: "integer", required: false, description: "Duration in minutes" },
    { name: "type", type: "integer", required: false, description: "Meeting type (1=instant, 2=scheduled, 8=recurring)" },
    { name: "password", type: "string", required: false, description: "Meeting password" },
  ], returnType: "object", group: "meeting" },
  { name: "meeting-list", description: "List upcoming meetings for a user", args: [
    { name: "user-id", type: "string", required: false, description: "User ID or email (default: me)" },
    { name: "type", type: "string", required: false, description: "Meeting type filter (scheduled, live, upcoming)" },
  ], returnType: "object", group: "meeting" },
  { name: "meeting-get", description: "Get meeting details by ID", args: [
    { name: "meeting-id", type: "string", required: true, description: "Meeting ID" },
  ], returnType: "object", group: "meeting" },
  { name: "meeting-update", description: "Update meeting settings", args: [
    { name: "meeting-id", type: "string", required: true, description: "Meeting ID" },
    { name: "topic", type: "string", required: false, description: "New meeting topic" },
    { name: "start-time", type: "string", required: false, description: "New start time" },
    { name: "duration", type: "integer", required: false, description: "New duration in minutes" },
  ], returnType: "object", group: "meeting" },
  { name: "meeting-delete", description: "Delete a scheduled meeting", args: [
    { name: "meeting-id", type: "string", required: true, description: "Meeting ID to delete" },
  ], returnType: "object", group: "meeting" },
  { name: "meeting-participants", description: "List participants of a past meeting", args: [
    { name: "meeting-id", type: "string", required: true, description: "Meeting ID" },
  ], returnType: "object", group: "meeting" },

  // User
  { name: "user-get", description: "Get user profile information", args: [
    { name: "user-id", type: "string", required: false, description: "User ID or email (default: me)" },
  ], returnType: "object", group: "user" },
  { name: "user-list", description: "List users in the account", args: [
    { name: "status", type: "string", required: false, description: "User status filter (active, inactive, pending)" },
    { name: "page-size", type: "integer", required: false, description: "Number of results per page" },
  ], returnType: "object", group: "user" },
  { name: "user-settings", description: "Get user settings", args: [
    { name: "user-id", type: "string", required: false, description: "User ID or email (default: me)" },
  ], returnType: "object", group: "user" },

  // Recording
  { name: "recording-list", description: "List cloud recordings for a user", args: [
    { name: "user-id", type: "string", required: false, description: "User ID or email (default: me)" },
    { name: "from", type: "string", required: false, description: "Start date (YYYY-MM-DD)" },
    { name: "to", type: "string", required: false, description: "End date (YYYY-MM-DD)" },
  ], returnType: "object", group: "recording" },
  { name: "recording-get", description: "Get recording details for a meeting", args: [
    { name: "meeting-id", type: "string", required: true, description: "Meeting ID" },
  ], returnType: "object", group: "recording" },
  { name: "recording-delete", description: "Delete a meeting recording", args: [
    { name: "meeting-id", type: "string", required: true, description: "Meeting ID" },
  ], returnType: "object", group: "recording" },
  { name: "recording-download", description: "Download a recording file", args: [
    { name: "download-url", type: "string", required: true, description: "Recording download URL" },
    { name: "output", type: "string", required: true, description: "Output file path" },
  ], returnType: "object", group: "recording" },

  // Report
  { name: "report-daily", description: "Get daily usage report", args: [
    { name: "year", type: "integer", required: false, description: "Year" },
    { name: "month", type: "integer", required: false, description: "Month (1-12)" },
  ], returnType: "object", group: "report" },
  { name: "report-meeting-detail", description: "Get detailed report for a past meeting", args: [
    { name: "meeting-id", type: "string", required: true, description: "Meeting ID" },
  ], returnType: "object", group: "report" },

  // Webinar
  { name: "webinar-create", description: "Create a new webinar", args: [
    { name: "topic", type: "string", required: true, description: "Webinar topic" },
    { name: "start-time", type: "string", required: false, description: "Start time in ISO 8601" },
    { name: "duration", type: "integer", required: false, description: "Duration in minutes" },
  ], returnType: "object", group: "webinar" },
  { name: "webinar-list", description: "List webinars for a user", args: [
    { name: "user-id", type: "string", required: false, description: "User ID or email (default: me)" },
  ], returnType: "object", group: "webinar" },
  { name: "webinar-registrants", description: "List webinar registrants", args: [
    { name: "webinar-id", type: "string", required: true, description: "Webinar ID" },
  ], returnType: "object", group: "webinar" },
];

export function getZoomApiSurface(): ApiEndpoint[] {
  return ZOOM_API_SURFACE;
}

export const ZOOM_BACKEND_SNIPPET = `
    def _zoom_request(self, method: str, endpoint: str, data: dict = None) -> dict:
        \"\"\"Make an authenticated Zoom API request.\"\"\"
        import urllib.request, json, os
        token = os.environ.get("ZOOM_JWT_TOKEN", os.environ.get("ZOOM_ACCESS_TOKEN", ""))
        url = f"https://api.zoom.us/v2{endpoint}"
        body = json.dumps(data).encode() if data else None
        req = urllib.request.Request(url, data=body, method=method)
        req.add_header("Authorization", f"Bearer {token}")
        req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req) as resp:
            if resp.status == 204:
                return {"status": "success"}
            return json.loads(resp.read().decode())

    def meeting_create(self, topic: str = "", start_time: str = "", duration: int = 60, type: int = 2, password: str = "", **kwargs) -> dict:
        \"\"\"Create a new Zoom meeting.\"\"\"
        payload = {"topic": topic, "type": type, "duration": duration}
        if start_time:
            payload["start_time"] = start_time
        if password:
            payload["password"] = password
        result = self._zoom_request("POST", "/users/me/meetings", payload)
        return {"id": result.get("id"), "join_url": result.get("join_url"), "topic": topic, "start_url": result.get("start_url")}

    def meeting_list(self, user_id: str = "me", type: str = "upcoming", **kwargs) -> dict:
        \"\"\"List meetings for a user.\"\"\"
        result = self._zoom_request("GET", f"/users/{user_id}/meetings?type={type}")
        meetings = [{"id": m["id"], "topic": m["topic"], "start_time": m.get("start_time")} for m in result.get("meetings", [])]
        return {"meetings": meetings, "total": result.get("total_records", 0)}

    def meeting_get(self, meeting_id: str = "", **kwargs) -> dict:
        \"\"\"Get meeting details.\"\"\"
        return self._zoom_request("GET", f"/meetings/{meeting_id}")

    def meeting_update(self, meeting_id: str = "", topic: str = "", start_time: str = "", duration: int = 0, **kwargs) -> dict:
        \"\"\"Update meeting settings.\"\"\"
        payload = {}
        if topic:
            payload["topic"] = topic
        if start_time:
            payload["start_time"] = start_time
        if duration:
            payload["duration"] = duration
        self._zoom_request("PATCH", f"/meetings/{meeting_id}", payload)
        return {"meeting_id": meeting_id, "updated": True}

    def meeting_delete(self, meeting_id: str = "", **kwargs) -> dict:
        \"\"\"Delete a scheduled meeting.\"\"\"
        self._zoom_request("DELETE", f"/meetings/{meeting_id}")
        return {"meeting_id": meeting_id, "deleted": True}

    def meeting_participants(self, meeting_id: str = "", **kwargs) -> dict:
        \"\"\"List participants of a past meeting.\"\"\"
        result = self._zoom_request("GET", f"/report/meetings/{meeting_id}/participants")
        participants = [{"name": p.get("name"), "email": p.get("user_email"), "duration": p.get("duration")} for p in result.get("participants", [])]
        return {"meeting_id": meeting_id, "participants": participants, "count": len(participants)}

    def user_get(self, user_id: str = "me", **kwargs) -> dict:
        \"\"\"Get user profile information.\"\"\"
        return self._zoom_request("GET", f"/users/{user_id}")

    def user_list(self, status: str = "active", page_size: int = 30, **kwargs) -> dict:
        \"\"\"List users in the account.\"\"\"
        result = self._zoom_request("GET", f"/users?status={status}&page_size={page_size}")
        users = [{"id": u["id"], "email": u["email"], "name": f"{u.get('first_name', '')} {u.get('last_name', '')}".strip()} for u in result.get("users", [])]
        return {"users": users, "total": result.get("total_records", 0)}

    def recording_list(self, user_id: str = "me", **kwargs) -> dict:
        \"\"\"List cloud recordings for a user.\"\"\"
        from_date = kwargs.get("from", "")
        to_date = kwargs.get("to", "")
        endpoint = f"/users/{user_id}/recordings"
        if from_date:
            endpoint += f"?from={from_date}"
        if to_date:
            endpoint += f"&to={to_date}" if "?" in endpoint else f"?to={to_date}"
        result = self._zoom_request("GET", endpoint)
        return {"meetings": result.get("meetings", []), "total": result.get("total_records", 0)}

    def recording_delete(self, meeting_id: str = "", **kwargs) -> dict:
        \"\"\"Delete a meeting recording.\"\"\"
        self._zoom_request("DELETE", f"/meetings/{meeting_id}/recordings")
        return {"meeting_id": meeting_id, "deleted": True}

    def report_daily(self, year: int = 0, month: int = 0, **kwargs) -> dict:
        \"\"\"Get daily usage report.\"\"\"
        import datetime
        if not year:
            now = datetime.date.today()
            year, month = now.year, now.month
        return self._zoom_request("GET", f"/report/daily?year={year}&month={month}")

    def webinar_create(self, topic: str = "", start_time: str = "", duration: int = 60, **kwargs) -> dict:
        \"\"\"Create a new webinar.\"\"\"
        payload = {"topic": topic, "type": 5, "duration": duration}
        if start_time:
            payload["start_time"] = start_time
        result = self._zoom_request("POST", "/users/me/webinars", payload)
        return {"id": result.get("id"), "topic": topic, "join_url": result.get("join_url")}
`;
