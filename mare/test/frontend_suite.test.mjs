import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('1. MARE Dynamic Configuration & API Service Layer', () => {
  let authToken = null;

  function setAuthToken(token) {
    authToken = token;
  }

  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  }

  function getApiBaseUrl(envVar) {
    return envVar || 'http://localhost:8555';
  }

  it('correctly uses environment variable or defaults to port 8555', () => {
    assert.equal(getApiBaseUrl(''), 'http://localhost:8555');
    assert.equal(getApiBaseUrl(undefined), 'http://localhost:8555');
    assert.equal(getApiBaseUrl('https://api.mare.ai'), 'https://api.mare.ai');
  });

  it('manages Bearer token injection into API request headers', () => {
    // Unauthenticated request
    setAuthToken(null);
    let headers = getAuthHeaders();
    assert.equal(headers['Content-Type'], 'application/json');
    assert.equal(headers['Authorization'], undefined);

    // Authenticated request
    setAuthToken('jwt_test_token_xyz123');
    headers = getAuthHeaders();
    assert.equal(headers['Authorization'], 'Bearer jwt_test_token_xyz123');
  });
});

describe('2. Workspace Hierarchical File Tree Engine', () => {
  function findNode(nodes, targetId) {
    for (const node of nodes) {
      if (node.id === targetId) return node;
      if (node.children) {
        const found = findNode(node.children, targetId);
        if (found) return found;
      }
    }
    return undefined;
  }

  function updateNodeContent(nodes, targetId, newContent, agentName) {
    return nodes.map(node => {
      if (node.id === targetId) {
        return {
          ...node,
          content: newContent,
          agentContents: { ...(node.agentContents || {}), [agentName]: newContent }
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateNodeContent(node.children, targetId, newContent, agentName)
        };
      }
      return node;
    });
  }

  const initialTree = [
    {
      id: 'folder-src',
      name: 'src',
      type: 'folder',
      children: [
        {
          id: 'file-main',
          name: 'main.py',
          type: 'file',
          content: 'print("hello")',
          agentContents: { 'Researcher Agent': 'print("hello")' }
        }
      ]
    },
    {
      id: 'file-readme',
      name: 'README.md',
      type: 'file',
      content: '# MARE Platform'
    }
  ];

  it('accurately resolves deep nested nodes by ID', () => {
    const foundMain = findNode(initialTree, 'file-main');
    assert.ok(foundMain);
    assert.equal(foundMain.name, 'main.py');
    assert.equal(foundMain.type, 'file');

    const foundFolder = findNode(initialTree, 'folder-src');
    assert.ok(foundFolder);
    assert.equal(foundFolder.type, 'folder');

    const notFound = findNode(initialTree, 'non-existent-id');
    assert.equal(notFound, undefined);
  });

  it('immutably updates targeted file contents without corrupting siblings', () => {
    const updatedTree = updateNodeContent(initialTree, 'file-main', 'print("updated content")', 'Python Coder');
    const updatedFile = findNode(updatedTree, 'file-main');
    
    assert.equal(updatedFile.content, 'print("updated content")');
    assert.equal(updatedFile.agentContents['Python Coder'], 'print("updated content")');

    // Ensure untouched sibling remains unchanged
    const readmeFile = findNode(updatedTree, 'file-readme');
    assert.equal(readmeFile.content, '# MARE Platform');
  });
});

describe('3. Multi-Agent Orchestration & Workflow State', () => {
  it('enforces unique node and edge identity when compiling DAGs', () => {
    const rawNodes = [
      { id: 'agent-1', label: 'Researcher' },
      { id: 'agent-2', label: 'Coder' },
      { id: 'agent-1', label: 'Researcher (Duplicate)' },
    ];

    const deduplicated = Array.from(new Map(rawNodes.map(n => [n.id, n])).values());
    assert.equal(deduplicated.length, 2);
    assert.equal(deduplicated[0].id, 'agent-1');
    assert.equal(deduplicated[1].id, 'agent-2');
  });

  it('safely parses agent workflow JSON blocks without crashing UI', () => {
    const validJsonBlock = '```json\n{"workflow": {"nodes": [{"id":"1"}], "edges": [{"id":"e1"}]}}\n```';
    const regex = /```json\s*([\s\S]*?)\s*```/g;
    const matches = [...validJsonBlock.matchAll(regex)];

    assert.equal(matches.length, 1);
    const parsed = JSON.parse(matches[0][1]);
    assert.ok(parsed.workflow);
    assert.equal(parsed.workflow.nodes.length, 1);
    assert.equal(parsed.workflow.edges.length, 1);
  });

  it('gracefully handles malformed JSON without raising uncaught exceptions', () => {
    const malformedJson = '```json\n{"workflow": {BROKEN_JSON}}\n```';
    const regex = /```json\s*([\s\S]*?)\s*```/g;
    const matches = [...malformedJson.matchAll(regex)];

    let didCatch = false;
    for (const match of matches) {
      try {
        JSON.parse(match[1]);
      } catch (err) {
        didCatch = true;
      }
    }
    assert.ok(didCatch, 'Malformed JSON should be caught cleanly');
  });
});

describe('4. Interactive Terminal & Command Dispatcher Logic', () => {
  function parseTerminalCommand(input) {
    const trimmed = input.trim();
    if (!trimmed) return { cmd: '', args: [] };
    const parts = trimmed.split(/\s+/);
    return { cmd: parts[0].toLowerCase(), args: parts.slice(1) };
  }

  it('correctly parses command names and argument parameters', () => {
    const parsedPython = parseTerminalCommand('python print("hello world")');
    assert.equal(parsedPython.cmd, 'python');
    assert.deepEqual(parsedPython.args, ['print("hello', 'world")']);

    const parsedLs = parseTerminalCommand('ls -la');
    assert.equal(parsedLs.cmd, 'ls');
    assert.deepEqual(parsedLs.args, ['-la']);

    const parsedRun = parseTerminalCommand('run Researcher Agent');
    assert.equal(parsedRun.cmd, 'run');
    assert.deepEqual(parsedRun.args, ['Researcher', 'Agent']);
  });
});
