import BrowserAPIEventHandler from '@/service/browser-api/BrowserAPIEventHandler';
import { MessageListener } from '@/utils/message';
import WorkflowManager from '@/workflowEngine/WorkflowManager';
import Browser from 'webextension-polyfill';

const messageListener = new MessageListener('offscreen');
const message = new MessageListener('background');

Browser.runtime.onMessage.addListener(messageListener.listener);

messageListener.on('workflow:execute', ({ workflow, options }) => {
  WorkflowManager.instance.execute(workflow, options);
});

messageListener.on('workflow:stop', (stateId) => {
  WorkflowManager.instance.stopExecution(stateId);
});

messageListener.on('workflow:resume', ({ id, nextBlock }) => {
  WorkflowManager.instance.resumeExecution(id, nextBlock);
});

messageListener.on('workflow:update', ({ id, data }) => {
  WorkflowManager.instance.updateExecution(id, data);
});

messageListener.on(BrowserAPIEventHandler.RuntimeEvents.ON_EVENT, (event) =>
  BrowserAPIEventHandler.instance.onBrowserEventListener(event)
);


window.addEventListener('message', ({ data }) => {
  if (data.type === "automa-fetch") {
    const response = message.sendMessage("fetch", data.data);
    response.then((res) => {
      window.frames[0].postMessage(
        {
          type: 'automa-fetch-response-' + data.data.id,
          data: res,
        },
        '*'
      );
    });
  }
});
