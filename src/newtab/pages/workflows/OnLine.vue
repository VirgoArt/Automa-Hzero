<template>
    <ui-modal v-model="state.show" custom-content content-position="start" @close="clearState">
        <ui-card class="mt-8 w-full" style="max-width: 1400px; min-height: 600px">
            <div class="online-list overflow-auto pb-4 pt-1">
                <div class="mb-8 flex items-center">
                    <h1 class="flex-1 text-2xl font-semibold">
                        {{ $t('common.online', 2) }}
                    </h1>
                    <v-remixicon name="riCloseLine" class="cursor-pointer text-gray-600 dark:text-gray-300"
                        @click="clearState" />
                </div>
            </div>
            <!-- 搜索框 -->
            <div class="flex items-center mb-4">
                <ui-input v-model="state.query" :placeholder="$t('common.search')" prepend-icon="riSearch2Line"
                    class="w-full md:w-1/3" />
                <div class="grow"></div>
                <ui-button variant="accent" class="ml-4" @click="fetchData" :disabled="state.loading">
                    <span v-if="!state.loading">{{ $t('common.refresh') }}</span>
                    <span v-else>{{ $t('common.loading') }}</span>
                </ui-button>
            </div>

            <!-- 加载状态 -->
            <div v-if="state.loading" class="text-center py-12">
                <div class="animate-pulse">
                    <v-remixicon name="riLoader2Line" size="48" class="inline-block text-primary animate-spin" />
                    <p class="mt-4 text-lg">{{ $t('common.loading') }}</p>
                </div>
            </div>

            <!-- 错误信息 -->
            <ui-card v-else-if="state.error" class="mb-4 bg-red-50 dark:bg-red-900/20">
                <div class="flex items-start">
                    <v-remixicon name="riErrorWarningLine" size="24" class="text-red-500 mt-1 mr-3" />
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-red-700 dark:text-red-300">{{ $t('common.error') }}</h3>
                        <p class="text-red-600 dark:text-red-400">{{ state.error }}</p>
                        <ui-button variant="danger" class="mt-2" @click="fetchData">
                            {{ $t('common.retry') }}
                        </ui-button>
                    </div>
                </div>
            </ui-card>

            <!-- 数据表格 -->
            <template v-else>
                <div v-if="tableData.length === 0" class="text-center py-12">
                    <img src="@/assets/svg/files-and-folder.svg" class="mx-auto max-w-sm opacity-50" />
                    <p class="text-xl font-semibold mt-4">{{ $t('message.noData') }}</p>
                    <p class="text-gray-500 dark:text-gray-400 mt-2">{{ $t('online.noDataDescription') }}</p>
                </div>
                <template v-else>
                    <div class="scroll w-full overflow-x-auto">
                        <ui-table with-pagination :headers="tableHeaders" :items="tableData" :search="state.query"
                            item-key="id" class="w-full">
                            <!-- 流程名称 -->
                            <template #item-name="{ item }">
                                <div class="font-medium">{{ item.name }}</div>
                            </template>

                            <!-- 版本号 -->
                            <template #item-version="{ item }">
                                <span
                                    class="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-sm">
                                    {{ item.version }}
                                </span>
                            </template>

                            <!-- 流程说明 -->
                            <template #item-description="{ item }">
                                <div class="max-w-lg">
                                    <p class="text-gray-600 dark:text-gray-300" :title="item.description">
                                        {{ item.description || $t('online.noDescription') }}
                                    </p>
                                </div>
                            </template>

                            <template #item-option="{ item }">
                                <div class="font-medium">
                                    <ui-button variant="accent" size="small" @click="useWorkflow(item)">
                                        {{ $t('common.use') }}
                                    </ui-button>
                                </div>
                            </template>
                        </ui-table>
                    </div>
                </template>
            </template>
        </ui-card>
    </ui-modal>
</template>
<script setup>
import { reactive, onMounted } from 'vue';
import emitter from '@/lib/mitt';
import { useI18n } from 'vue-i18n';
import dbStorage from '@/db/storage';
import { loadWorkflow } from '@/utils/workflowData';
import { fetchClientToken } from '@/utils/api';


const { t } = useI18n();

const state = reactive({
    show: false,
    loading: false,
    error: null,
    query: '',
});

// 表格数据
const tableData = reactive([]);

emitter.on('ui:online', (event = {}) => {
    Object.assign(state, event);
    if (state.show) {
        fetchData();
    }
});

function clearState() {
    state.show = false;
}

// 表格列配置
const tableHeaders = [
    {
        value: 'name',
        text: t('workflow.online.columns.name'),
        align: 'left',
        sortable: false,
    },
    {
        value: 'version',
        text: t('workflow.online.columns.version'),
        align: 'center',
        sortable: false,
    },
    {
        value: 'description',
        text: t('workflow.online.columns.description'),
        align: 'left',
        sortable: false,
    },
    {
        value: 'option',
        text: t('common.action'),
        align: 'center',
        sortable: false,
    },
];

// 从接口获取数据
async function fetchData() {
    state.loading = true;
    state.error = null;
    try {
        const token = await fetchClientToken();
        const API_PATH = await dbStorage.variables.where('name').equals('HZERO_PATH').first();
        const HZERO_INTERFACE_CODE = await dbStorage.variables.where('name').equals('HZERO_INTERFACE_CODE').first();
        const HZERO_INTERFACE_LIST = await dbStorage.variables.where('name').equals('HZERO_INTERFACE_LIST').first();

        const response = await fetch(API_PATH.value + `/hitf/v1/rest/invoke?namespace=HZERO&serverCode=${HZERO_INTERFACE_CODE.value}&interfaceCode=${HZERO_INTERFACE_LIST.value}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
            },
            data: {
            }
        })

        if (!response.ok) {
            throw new Error(await response.text() || 'Failed to fetch data');
        }

        const data = await response.json();

        // 清空现有数据
        tableData.splice(0, tableData.length);

        // 添加新数据

        if (Array.isArray(JSON.parse(data.payload))) {
            JSON.parse(data.payload).forEach(item => {
                tableData.push({
                    id: item.id || `${item.name}-${item.version}`,
                    name: item.workflowName,
                    version: item.version,
                    description: item.workflowDesc,
                });
            });
        }
    } catch (error) {
        console.error('Error fetching online workflows:', error);
    } finally {
        state.loading = false;
    }
}

async function useWorkflow(data) {
    const token = await fetchClientToken();
    const API_PATH = await dbStorage.variables.where('name').equals('HZERO_PATH').first();
    const HZERO_INTERFACE_CODE = await dbStorage.variables.where('name').equals('HZERO_INTERFACE_CODE').first();
    const HZERO_INTERFACE_CONFIG = await dbStorage.variables.where('name').equals('HZERO_INTERFACE_CONFIG').first();
    const response = await fetch(API_PATH.value + `/hitf/v1/rest/invoke?namespace=HZERO&serverCode=${HZERO_INTERFACE_CODE.value}&interfaceCode=${HZERO_INTERFACE_CONFIG.value}`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'content-type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({
            "requestParamMap": {
                "id": data.id
            },
        })
    })

    if (!response.ok) {
        throw new Error(await response.text() || 'Failed to fetch data');
    }

    const res = await response.json();
    const payload = JSON.parse(res.payload);
    const config = JSON.parse(payload.config);
    console.log('获取到配置: ', res);
    loadWorkflow(config);
}

</script>
