<template>
  <div class="max-w-lg">
    <div class="bg-box-transparent mb-2 inline-block rounded-full p-3">
      <img src="@/assets/svg/logo.svg" class="w-14" />
    </div>
    <p class="text-2xl font-semibold">Automa(Hzero集成联合版)</p>
    <p class="mb-2 mt-1">Automa Version: {{ extensionVersion }}</p>
    <!-- <p class="text-gray-600 dark:text-gray-200">
      Automa is a chrome extension for browser automation. From auto-fill forms,
      doing a repetitive task, taking a screenshot, to scraping data of the
      website, it's up to you what you want to do with this extension.
    </p> -->
     <p class="text-gray-600 dark:text-gray-200">
      本插件是基于Automa扩展实现分发，对于Hzero用户，提供了更多的功能。
    </p>
    <!-- <div class="mt-4 space-x-2">
      <a
        v-for="link in links"
        :key="link.name"
        v-tooltip.group="link.name"
        :href="link.url"
        target="_blank"
        class="hoverable inline-block rounded-lg p-2 transition"
      >
        <v-remixicon :name="link.icon" />
      </a>
    </div> -->
    <!-- <div class="my-8 border-b dark:border-gray-700"></div>
    <h2 class="text-xl font-semibold">Contributors</h2>
    <p class="mt-1 text-gray-600 dark:text-gray-200">
      Thanks to everyone who has submitted issues, made suggestions, and
      generally helped make this a better project.
    </p> -->
    <!-- <div class="mt-4 mb-12 grid grid-cols-7 gap-2">
      <a
        v-for="contributor in store.contributors"
        :key="contributor.username"
        v-tooltip.group="contributor.username"
        :href="contributor.url"
        target="_blank"
        rel="noopener"
      >
        <img
          :src="contributor.avatar"
          :alt="`${contributor.username} avatar`"
          class="w-16 rounded-lg"
        />
      </a>
    </div>
    <h3>Translators</h3> -->
    <div
      class="flex items-center rounded-lg border p-4 dark:border-gray-700"
    >
      <span class="bg-box-transparent inline-block rounded-full p-2">
        <v-remixicon name="riAdminLine" />
      </span>
      <div class="ml-4 flex-1 leading-tight">
        <p class="text-sm text-gray-600 dark:text-gray-200">
          设置Admin模式
        </p>
      </div>
      <ui-button 
       @click="enabledAdminModal.show = true"
       :disabled="store.adminModel"
      >
        启用Admin
      </ui-button>
      </div>
    </div>
    <ui-modal v-model="enabledAdminModal.show" title="启用Admin">
      <ui-input
        class="mb-4 w-full"
        placeholder="请输入控制码"
        type="password"
        v-model="enabledAdminModal.password"
      />
     
      <div class="flex space-x-2">
        <ui-button class="w-full">
          {{ t('common.cancel') }}
        </ui-button>
        <ui-button
          variant="accent"
          class="w-full"
          @click="enabledAdminModal.handleConfirm"
        >
          {{
            t('common.confirm')
          }}
        </ui-button>
      </div>
    </ui-modal>
</template>
<script setup>
/* eslint-disable camelcase */
import { Base64 } from 'js-base64';
import { useGroupTooltip } from '@/composable/groupTooltip';
import { useStore } from '@/stores/main';
import { useI18n } from 'vue-i18n';
import { communities } from '@/utils/shared';
import { onMounted, shallowReactive} from 'vue';
import browser from 'webextension-polyfill';

useGroupTooltip();
const store = useStore();
const { t } = useI18n();

const extensionVersion = browser.runtime.getManifest().version;
const links = [
  ...communities,
  {
    name: 'Website',
    icon: 'riGlobalLine',
    url: 'https://extension.automa.site',
  },
  {
    name: 'Documentation',
    icon: 'riBook3Line',
    url: 'https://docs.extension.automa.site',
  },
  {
    name: 'Blog',
    icon: 'riArticleLine',
    url: 'https://blog.automa.site',
  },
];

const enabledAdminModal = shallowReactive({
  show: false,
  password: '',
  handleConfirm() {
    if (Base64.encode(enabledAdminModal.password) === 'QWRtaW5AMTIzIQ==') {
      store.adminModel = true;
      enabledAdminModal.show = false;
    } else {
      alert('控制码错误');
    }
  },
});

onMounted(async () => {
  if (store.contributors) return;

  try {
    const response = await fetch(
      'https://api.github.com/repositories/412741449/contributors'
    );
    const contributors = (await response.json()).reduce(
      (acc, { type, avatar_url, login, html_url }) => {
        if (type !== 'Bot') {
          acc.push({
            username: login,
            url: html_url,
            avatar: avatar_url,
          });
        }

        return acc;
      },
      []
    );

    store.contributors = contributors;
  } catch (error) {
    console.error(error);
  }
});
</script>
