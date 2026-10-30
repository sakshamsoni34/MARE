import sys
import os

# Ensure current directory is on python path
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app
from database import init_db

def test_full_persistence_lifecycle():
    init_db()
    with TestClient(app) as client:
        print("--- 1. Testing DB Health ---")
        res = client.get("/api/db-test")
        assert res.status_code == 200, f"db-test failed: {res.text}"
        print(f"DB Test response: {res.json()['status']}")

        print("--- 2. Testing Project Creation ---")
        res = client.post("/api/projects", json={
            "name": "ProductionTestProject",
            "description": "Validating Pillar 1 Database Persistence",
            "goal": "Enterprise Grade Storage",
            "priority": "critical"
        })
        assert res.status_code == 200, f"Project creation failed: {res.text}"

        print("--- 3. Testing File Persistence ---")
        res = client.post("/api/sync/file", json={
            "node_id": "file_test_001",
            "parent_id": None,
            "project_name": "ProductionTestProject",
            "name": "pipeline.py",
            "type": "file",
            "content": "print('hello from persisted file')",
            "agent_name": "Coder Agent"
        })
        assert res.status_code == 200, f"File persistence failed: {res.text}"

        print("--- 4. Testing Conversation Persistence ---")
        res = client.post("/api/sync/conversation", json={
            "convo_id": "convo_test_001",
            "project_name": "ProductionTestProject",
            "agent": "Planner Agent",
            "title": "System Architecture",
            "content": "Plan for microservices and database",
            "timestamp": "2026-10-30T17:00:00Z"
        })
        assert res.status_code == 200, f"Conversation persistence failed: {res.text}"

        print("--- 5. Testing Workflow Persistence ---")
        res = client.post("/api/sync/workflow", json={
            "project_name": "ProductionTestProject",
            "nodes": [{"id": "n1", "data": {"label": "Data Ingest"}}],
            "edges": [{"id": "e1-2", "source": "n1", "target": "n2"}]
        })
        assert res.status_code == 200, f"Workflow persistence failed: {res.text}"

        print("--- 6. Testing Agent State Persistence ---")
        res = client.post("/api/sync/agent-state", json={
            "agent_name": "Researcher Agent",
            "project_name": "ProductionTestProject",
            "script_code": "# Researcher Script Active"
        })
        assert res.status_code == 200, f"Agent state persistence failed: {res.text}"

        print("--- 7. Testing State Hydration (/api/state) ---")
        res = client.get("/api/state?project=ProductionTestProject")
        assert res.status_code == 200, f"State hydration failed: {res.text}"
        state = res.json()["state"]
        print("State returned:")
        print("  Projects:", state["projects"])
        print("  ActiveProject:", state["activeProject"])
        print("  FileSystem count:", len(state["fileSystem"]))
        print("  PastConversations count:", len(state["pastConversations"]))
        print("  WorkflowNodes count:", len(state["workflowNodes"]))

        assert "ProductionTestProject" in state["projects"]
        assert state["activeProject"] == "ProductionTestProject"
        assert any(f["id"] == "file_test_001" for f in state["fileSystem"])
        assert any(c["id"] == "convo_test_001" for c in state["pastConversations"])
        assert len(state["workflowNodes"]) == 1

        print("--- 8. Testing Cleanup ---")
        del_file = client.delete("/api/sync/file/file_test_001")
        assert del_file.status_code == 200

        del_convo = client.delete("/api/sync/conversation/convo_test_001")
        assert del_convo.status_code == 200

        del_proj = client.delete("/api/projects/ProductionTestProject")
        assert del_proj.status_code == 200

        print("ALL TESTS PASSED! Pillar 1 Database Persistence is fully operational.")

if __name__ == "__main__":
    test_full_persistence_lifecycle()
