import credentialUtil from '@/utils/credentialUtil';
import Dexie from 'dexie';

const dbStorage = new Dexie('storage');
dbStorage.version(2).stores({
  tablesData: '++id, tableId',
  tablesItems: '++id, name, createdAt, modifiedAt',
  variables: '++id, &name',
  credentials: '++id, &name',
});

dbStorage.credentials
  .add({
    name: "HZERO_ID",
    createdAt: Date.now(),
    value: credentialUtil.encrypt(HZERO_AUTOMA_CLIEN_ID),
  });
dbStorage.credentials
  .add({
    name: "HZERO_KEY",
    createdAt: Date.now(),
    value: credentialUtil.encrypt(HZERO_AUTOMA_CLIEN_KEY),
  });

dbStorage.variables
  .add({
    name: "HZERO_PATH",
    createdAt: Date.now(),
    value: HZERO_PATH,
  });
dbStorage.variables
  .add({
    name: "HZERO_INTERFACE_CODE",
    createdAt: Date.now(),
    value: HZERO_INTERFACE_CODE,
  });
dbStorage.variables
  .add({
    name: "HZERO_INTERFACE_LIST",
    createdAt: Date.now(),
    value: HZERO_INTERFACE_LIST,
  });
dbStorage.variables
  .add({
    name: "HZERO_INTERFACE_CONFIG",
    createdAt: Date.now(),
    value: HZERO_INTERFACE_CONFIG,
  });
export default dbStorage;
