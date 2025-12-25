import browser from 'webextension-polyfill';
import { useWorkflowStore } from '@/stores/workflow';
import { useDialog } from '@/composable/dialog';

import { registerWorkflowTrigger } from './workflowTrigger';
import {
  parseJSON,
  fileSaver,
  openFilePicker,
  findTriggerBlock,
} from './helper';

const dialog = useDialog();
const contextMenuPermission =
  BROWSER_TYPE === 'firefox' ? 'menus' : 'contextMenus';
const checkPermission = (permissions) =>
  browser.permissions.contains({ permissions });
const requiredPermissions = {
  trigger: {
    name: contextMenuPermission,
    hasPermission({ data }) {
      const permissions = [];

      if (data.triggers) {
        data.triggers.forEach((trigger) => {
          if (trigger.type !== 'context-menu') return;

          permissions.push(contextMenuPermission);
        });
      } else if (data.type === 'context-menu') {
        permissions.push(contextMenuPermission);
      }

      return checkPermission(permissions);
    },
  },
  clipboard: {
    name: 'clipboardRead',
    hasPermission() {
      const clipboardPermissions = ['clipboardRead'];
      if (BROWSER_TYPE === 'firefox')
        clipboardPermissions.push('clipboardWrite');

      return checkPermission(clipboardPermissions);
    },
  },
  notification: {
    name: 'notifications',
    hasPermission() {
      return checkPermission(['notifications']);
    },
  },
  'handle-download': {
    name: 'downloads',
    hasPermission() {
      return checkPermission(['downloads']);
    },
  },
  'save-assets': {
    name: 'downloads',
    hasPermission() {
      return checkPermission(['downloads']);
    },
  },
  cookie: {
    name: 'cookies',
    hasPermission() {
      return checkPermission(['cookies']);
    },
  },
};

export async function getWorkflowPermissions(drawflow) {
  let blocks = [];
  const permissions = [];
  const drawflowData =
    typeof drawflow === 'string' ? parseJSON(drawflow) : drawflow;

  if (drawflowData.nodes) {
    blocks = drawflowData.nodes;
  } else {
    blocks = Object.values(drawflowData.drawflow?.Home?.data || {});
  }

  for (const block of blocks) {
    const name = block.label || block.name;
    const permission = requiredPermissions[name];

    if (permission && !permissions.includes(permission.name)) {
      const hasPermission = await permission.hasPermission(block);
      if (!hasPermission) permissions.push(permission.name);
    }
  }

  return permissions;
}

function handleOnLoadReader(wfConfigJSON, options = {}) {
  const workflow = wfConfigJSON;
  const workflowStore = useWorkflowStore();

  if (workflow.includedWorkflows) {
    Object.keys(workflow.includedWorkflows).forEach((workflowId) => {
      const isWorkflowExists = Boolean(
        workflowStore.workflows[workflowId]
      );

      if (isWorkflowExists) return;

      const currentWorkflow = workflow.includedWorkflows[workflowId];
      currentWorkflow.table =
        currentWorkflow.table || currentWorkflow.dataColumns;
      delete currentWorkflow.dataColumns;

      workflowStore.insert(
        {
          ...currentWorkflow,
          id: workflowId,
          createdAt: Date.now(),
        },
        { duplicateId: options.duplicateId }
      );
    });

    delete workflow.includedWorkflows;
  }

  workflow.table = workflow.table || workflow.dataColumns;
  delete workflow.dataColumns;

  if (typeof workflow.drawflow === 'string') {
    workflow.drawflow = parseJSON(workflow.drawflow, {});
  }

  return workflowStore
    .insert({
      ...workflow,
      createdAt: Date.now(),
    }, { duplicateId: options.duplicateId })
    .then((result) => {
      Object.values(result).forEach((item) => {
        const triggerBlock = findTriggerBlock(item.drawflow);
        registerWorkflowTrigger(item.id, triggerBlock);
      });
      return result;
    });
};

export function importWorkflow(attrs = {}) {
  return new Promise((resolve, reject) => {
    openFilePicker(['application/json'], attrs)
      .then((files) => {
        files.forEach((file) => {
          const reader = new FileReader();
          reader.onload = async ({ target }) => {
            const res = await handleOnLoadReader(JSON.parse(target.result), { duplicateId: true });
            resolve(res);
          };
          reader.readAsText(file);
        });
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

export function loadWorkflow(WfJson) {
  let resolveRes, rejectRes;
  const res = new Promise((resolve, reject) => { resolveRes = resolve; rejectRes = reject });
  const workflow = WfJson;
  const workflowStore = useWorkflowStore();
  if (workflowStore.getById(workflow.id)) {
    dialog.confirm({
      title: '应用工作流',
      okVariant: 'danger',
      body: '当前流程已存在，是否覆盖更新？',
      onConfirm: async () => {
        workflowStore.delete(workflow.id);
        const res = await handleOnLoadReader(WfJson, { duplicateId: true });
        resolveRes(res);
      },
    });
  } else {
    handleOnLoadReader(WfJson, { duplicateId: true }).then((res) => {
      resolveRes(res);
    });
  }


  return res;
}

const defaultValue = {
  name: '',
  icon: '',
  table: [],
  settings: {},
  globalData: '',
  dataColumns: [],
  description: '',
  drawflow: { nodes: [], edges: [] },
  version: browser.runtime.getManifest().version,
};

export function convertWorkflow(workflow, additionalKeys = []) {
  if (!workflow) return null;

  const keys = [
    'name',
    'id',
    'icon',
    'table',
    'version',
    'drawflow',
    'settings',
    'globalData',
    'description',
    ...additionalKeys,
  ];
  const content = {
    extVersion: browser.runtime.getManifest().version,
  };

  keys.forEach((key) => {
    content[key] = workflow[key] ?? defaultValue[key];
  });

  return content;
}
function findIncludedWorkflows(
  { drawflow },
  store,
  maxDepth = 3,
  workflows = {}
) {
  if (maxDepth === 0) return workflows;

  const flow = parseJSON(drawflow, drawflow);
  const blocks = flow?.drawflow?.Home.data ?? flow.nodes ?? null;
  if (!blocks) return workflows;

  const checkWorkflow = (type, workflowId) => {
    if (type !== 'execute-workflow' || workflows[workflowId]) return;

    const workflow = store.getById(workflowId);
    if (workflow) {
      workflows[workflowId] = convertWorkflow(workflow);
      findIncludedWorkflows(workflow, store, maxDepth - 1, workflows);
    }
  };

  if (flow.nodes) {
    flow.nodes.forEach((node) => {
      checkWorkflow(node.label, node.data.workflowId);
    });
  } else {
    Object.values(blocks).forEach(({ data, name }) => {
      checkWorkflow(name, data.workflowId);
    });
  }

  return workflows;
}
export function exportWorkflow(workflow) {
  if (workflow.isProtected) return;

  const workflowStore = useWorkflowStore();
  const includedWorkflows = findIncludedWorkflows(workflow, workflowStore);
  const content = convertWorkflow(workflow);

  content.includedWorkflows = includedWorkflows;

  const blob = new Blob([JSON.stringify(content)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  fileSaver(`${workflow.name}.automa.json`, url);
}

export default {
  export: exportWorkflow,
  import: importWorkflow,
};
