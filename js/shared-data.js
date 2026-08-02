/* ============================================================
 * shared-data.js
 * 多租户 + 多项目 + 分销授权 数据层
 * 提供 seed 数据 + 过滤/配额工具函数，所有页面通过 <script> 引入
 * 依赖：Vue 3（ref, reactive, computed）需在引入本文件前加载
 * ============================================================ */

(function (global) {
  'use strict';

  /* ============== 租户 Seed ============== */
  const TENANTS = [
    { id: 'T1', code: 'yunchuang', name: '云创科技集团', status: 'active', contactName: '张总', contactPhone: '13800138001', createdAt: '2024-01-15 09:00:00' },
    { id: 'T2', code: 'huaxin',     name: '华信智造',     status: 'active', contactName: '陈总', contactPhone: '13900139002', createdAt: '2025-06-10 14:30:00' },
  ];

  /* ============== 租户配额 Seed ============== */
  const TENANT_QUOTAS = [
    { tenantId: 'T1', poleTotal: 2000, poleUsed: 580, projectTotal: 50, projectUsed: 5 },
    { tenantId: 'T2', poleTotal: 500,  poleUsed: 0,   projectTotal: 10, projectUsed: 0 },
  ];

  /* ============== 组织 Seed（追加 tenantId） ============== */
  const ORGANIZATIONS = [
    // T1: 现有 7 个组织全部归 T1
    { id: 1, tenantId: 'T1', name: '云创科技集团', parentId: null, sort: 1 },
    { id: 2, tenantId: 'T1', name: '华东分公司', parentId: 1, sort: 1 },
    { id: 3, tenantId: 'T1', name: '上海办事处', parentId: 2, sort: 1 },
    { id: 4, tenantId: 'T1', name: '苏州办事处', parentId: 2, sort: 2 },
    { id: 5, tenantId: 'T1', name: '华南分公司', parentId: 1, sort: 2 },
    { id: 6, tenantId: 'T1', name: '广州办事处', parentId: 5, sort: 1 },
    { id: 7, tenantId: 'T1', name: '深圳办事处', parentId: 5, sort: 2 },
    // T2: 新建 5 个组织（独立组织树）
    { id: 8,  tenantId: 'T2', name: '华信智造总公司', parentId: null, sort: 1 },
    { id: 9,  tenantId: 'T2', name: '华东事业部',   parentId: 8, sort: 1 },
    { id: 10, tenantId: 'T2', name: '上海运营中心', parentId: 9, sort: 1 },
    { id: 11, tenantId: 'T2', name: '华南事业部',   parentId: 8, sort: 2 },
    { id: 12, tenantId: 'T2', name: '广州运营中心', parentId: 11, sort: 1 },
  ];

  /* ============== 项目 Seed ============== */
  const PROJECTS = [
    // T1 项目
    { id: 1, tenantId: 'T1', orgId: 3, name: '智慧园区照明项目', code: 'PRJ-T1-001', status: 'active', poleQuota: 300, poleUsed: 280, remark: '上海园区一期', lng: 121.473701, lat: 31.230416, createdAt: '2024-03-01 10:00:00' },
    { id: 2, tenantId: 'T1', orgId: 6, name: '城市道路改造项目', code: 'PRJ-T1-002', status: 'active', poleQuota: 200, poleUsed: 150, remark: '广州滨江路',   lng: 113.324480, lat: 23.106600, createdAt: '2024-05-15 14:20:00' },
    { id: 3, tenantId: 'T1', orgId: 4, name: '滨江路景观照明',   code: 'PRJ-T1-003', status: 'active', poleQuota: 100, poleUsed: 100, remark: '苏州河段',     lng: 120.585315, lat: 31.298886, createdAt: '2024-08-10 09:30:00' },
    { id: 4, tenantId: 'T1', orgId: 7, name: '深圳前海智慧路',   code: 'PRJ-T1-004', status: 'active', poleQuota: 50,  poleUsed: 50,  remark: '前海合作区',   lng: 113.895000, lat: 22.524000, createdAt: '2025-01-20 11:15:00' },
    { id: 5, tenantId: 'T1', orgId: 3, name: '园区二期扩建',     code: 'PRJ-T1-005', status: 'active', poleQuota: 0,   poleUsed: 0,   remark: '筹备中',       createdAt: '2025-06-01 16:00:00' },
    // T2 项目
    { id: 6, tenantId: 'T2', orgId: 10, name: '上海试点项目',     code: 'PRJ-T2-001', status: 'active', poleQuota: 200, poleUsed: 0,   remark: '从 T1 分得配额', lng: 121.473701, lat: 31.230416, createdAt: '2025-07-15 10:00:00' },
    { id: 7, tenantId: 'T2', orgId: 12, name: '广州试点项目',     code: 'PRJ-T2-002', status: 'active', poleQuota: 150, poleUsed: 0,   remark: '从 T1 分得配额', lng: 113.264435, lat: 23.129110, createdAt: '2025-08-20 14:30:00' },
    { id: 8, tenantId: 'T2', orgId: 10, name: '上海二期项目',     code: 'PRJ-T2-003', status: 'active', poleQuota: 50,  poleUsed: 0,   remark: '筹备中',         lng: 121.473701, lat: 31.230416, createdAt: '2026-01-10 09:00:00' },
  ];

  /* ============== 分销授权记录 Seed ============== */
  const PROJECT_ALLOCATIONS = [
    { id: 1, fromTenantId: 'T1', toTenantId: 'T2', poleQuota: 500, poleUsed: 0, projectQuota: 10, projectUsed: 3, status: 'active', operator: 'admin', createdAt: '2025-06-15 10:00:00' },
  ];

  /* ============== 组织 Seed（参考 ruoyi-vue-pro dept） ============== */
  const DEPTS = [
    { id: 100, name: '云创科技集团', parentId: 0,   orderNum: 0, leader: '张总',   phone: '13800138001', email: 'admin@yunchuang.com', status: '0', createTime: '2023-09-29 11:47:20' },
    { id: 101, name: '浙江省',       parentId: 100, orderNum: 1, leader: '李主任', phone: '13800138002', email: 'zj@yunchuang.com',    status: '0', createTime: '2023-09-29 11:47:20' },
    { id: 102, name: '宁波市',       parentId: 101, orderNum: 1, leader: '王局长', phone: '13800138003', email: 'nb@yunchuang.com',    status: '0', createTime: '2023-09-29 11:47:20' },
    { id: 103, name: '海曙区',       parentId: 102, orderNum: 1, leader: '赵区长', phone: '13800138004', email: 'hs@yunchuang.com',    status: '0', createTime: '2023-09-29 11:47:20' },
    { id: 104, name: '鼓楼街道',     parentId: 103, orderNum: 1, leader: '钱主任', phone: '13800138005', email: 'gl@yunchuang.com',    status: '0', createTime: '2023-09-29 11:47:20' },
  ];

  /* ============== 用户 Seed（参考 ruoyi-vue-pro user） ============== */
  const USERS = [
    { id: 1,  username: 'admin',     nickname: '若依管理员', deptId: 103, phone: '15888888888', email: 'ry@qq.com',       sex: '0', status: '0', remark: '管理员', createTime: '2023-09-29 11:47:20' },
    { id: 2,  username: 'ry',         nickname: '若依',      deptId: 102, phone: '15666666666', email: 'ry@qq.com',       sex: '0', status: '0', remark: '测试员', createTime: '2023-09-29 11:47:20' },
    { id: 3,  username: 'common',     nickname: '普通用户',   deptId: 100, phone: '13333333333', email: 'common@qq.com',   sex: '1', status: '0', remark: '', createTime: '2023-09-29 11:47:20' },
    { id: 4,  username: 'light_admin',nickname: '照明管理员', deptId: 103, phone: '13900138001', email: 'light@qq.com',    sex: '0', status: '0', remark: '负责照明项目管理', createTime: '2024-01-10 09:30:00' },
    { id: 5,  username: 'pole_ops',   nickname: '灯杆运维',   deptId: 104, phone: '13900138002', email: 'ops@qq.com',      sex: '0', status: '0', remark: '灯杆运维工程师', createTime: '2024-02-15 14:20:00' },
    { id: 6,  username: 'dev_zhang',  nickname: '张工',      deptId: 103, phone: '13900138003', email: 'zhang@qq.com',    sex: '0', status: '0', remark: '研发工程师', createTime: '2024-03-01 10:00:00' },
    { id: 7,  username: 'dev_li',     nickname: '李工',      deptId: 104, phone: '13900138004', email: 'li@qq.com',       sex: '1', status: '1', remark: '休长假', createTime: '2024-04-12 16:30:00' },
    { id: 8,  username: 'test_wang',  nickname: '王测试',    deptId: 102, phone: '13900138005', email: 'wang@qq.com',     sex: '0', status: '0', remark: 'QA工程师', createTime: '2024-05-20 11:15:00' },
    { id: 9,  username: 'fin_chen',   nickname: '陈财务',    deptId: 101, phone: '13900138006', email: 'chen@qq.com',     sex: '1', status: '0', remark: '财务负责人', createTime: '2024-06-01 09:00:00' },
    { id: 10, username: 'ops_sun',    nickname: '孙运维',    deptId: 104, phone: '13900138007', email: 'sun@qq.com',      sex: '0', status: '0', remark: '系统运维', createTime: '2024-07-10 13:45:00' },
  ];

  /* ============== 角色 Seed（参考 ruoyi-vue-pro role） ============== */
  const ROLES = [
    { id: 1, roleName: '超级管理员', roleKey: 'admin',  roleSort: 1, status: '0', dataScope: '1', menuIds: [], remark: '超级管理员，拥有全部权限', createTime: '2023-09-29 11:47:20' },
    { id: 2, roleName: '普通角色',   roleKey: 'common',roleSort: 2, status: '0', dataScope: '2', menuIds: [1,2,3,4,5,100,101,102,103,104,105,200,201,202,1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,1012,1013,1014,500,5001,5002,5003,5004,5005,5006,5007,5008,5010,5015,5016,5017,5018], remark: '普通用户角色', createTime: '2023-09-29 11:47:20' },
    { id: 3, roleName: '照明管理员',   roleKey: 'light',  roleSort: 3, status: '0', dataScope: '2', menuIds: [1,4,5,100,101,102,103,200,201,202,500,5010,5015,5016], remark: '负责照明项目管理', createTime: '2024-01-10 09:30:00' },
    { id: 4, roleName: '运维工程师',   roleKey: 'ops',    roleSort: 4, status: '0', dataScope: '3', menuIds: [1,2,3,4,5,500,5010,5015,5016,5017,5018], remark: '系统运维', createTime: '2024-02-15 14:20:00' },
    { id: 5, roleName: '只读角色',     roleKey: 'viewer', roleSort: 5, status: '1', dataScope: '1', menuIds: [1,2,3,4,5,100,101,102,103,104,105,200,201,202,500], remark: '仅查看权限，已停用', createTime: '2024-03-01 10:00:00' },
  ];

  /* ============== 用户角色关联 Seed ============== */
  const USER_ROLES = [
    { userId: 1, roleId: 1 },
    { userId: 2, roleId: 2 },
    { userId: 3, roleId: 2 },
    { userId: 4, roleId: 3 },
    { userId: 5, roleId: 4 },
    { userId: 6, roleId: 2 },
    { userId: 7, roleId: 2 },
    { userId: 8, roleId: 2 },
    { userId: 9, roleId: 2 },
    { userId: 10, roleId: 4 },
  ];

  /* ============== 菜单 Seed（参考 ruoyi-vue-pro menu 树） ============== */
  const MENU_TREE = [
    { id: 1, parentId: 0, menuName: '首页',       menuType: 'M', orderNum: 1, path: '/index', component: 'index', perms: '', icon: 'home', visible: '0', status: '0' },
    /* 设备管理 */
    { id: 2, parentId: 0, menuName: '设备管理',    menuType: 'M', orderNum: 2, path: '/device', component: '', perms: '', icon: 'monitor', visible: '0', status: '0' },
    { id: 100, parentId: 2, menuName: '产品分类',  menuType: 'C', orderNum: 1, path: 'category', component: 'device/category', perms: 'device:category:list', icon: 'collection', visible: '0', status: '0' },
    { id: 101, parentId: 2, menuName: '产品管理',  menuType: 'C', orderNum: 2, path: 'product',  component: 'device/product',  perms: 'device:product:list',  icon: 'goods', visible: '0', status: '0' },
    { id: 102, parentId: 2, menuName: '设备管理',  menuType: 'C', orderNum: 3, path: 'list',      component: 'device/list',      perms: 'device:list',          icon: 'cpu', visible: '0', status: '0' },
    { id: 103, parentId: 2, menuName: '设备分组',  menuType: 'C', orderNum: 4, path: 'group',     component: 'device/group',     perms: 'device:group:list',     icon: 'folder', visible: '0', status: '0' },
    /* 智慧灯杆 */
    { id: 3, parentId: 0, menuName: '智慧灯杆',    menuType: 'M', orderNum: 3, path: '/pole', component: '', perms: '', icon: 'sunny', visible: '0', status: '0' },
    { id: 104, parentId: 3, menuName: '灯杆管理',  menuType: 'C', orderNum: 1, path: 'manage',   component: 'pole/manage',   perms: 'pole:list', icon: 'sunny', visible: '0', status: '0' },
    { id: 105, parentId: 3, menuName: '灯控策略',  menuType: 'C', orderNum: 2, path: 'strategy', component: 'pole/strategy', perms: 'pole:strategy:list', icon: 'clock', visible: '0', status: '0' },
    /* 项目管理 */
    { id: 4, parentId: 0, menuName: '项目管理',    menuType: 'M', orderNum: 4, path: '/project', component: '', perms: '', icon: 'folder', visible: '0', status: '0' },
    { id: 106, parentId: 4, menuName: '项目列表',  menuType: 'C', orderNum: 1, path: 'list',     component: 'project/list',   perms: 'project:list', icon: 'files', visible: '0', status: '0' },
    { id: 107, parentId: 4, menuName: '项目分配',  menuType: 'C', orderNum: 2, path: 'allocate', component: 'project/allocate', perms: 'project:allocate', icon: 'share', visible: '0', status: '0' },
    { id: 108, parentId: 4, menuName: '配额看板',  menuType: 'C', orderNum: 3, path: 'quota',    component: 'project/quota',  perms: 'project:quota', icon: 'data-analysis', visible: '0', status: '0' },
    { id: 109, parentId: 4, menuName: '分配流水',  menuType: 'C', orderNum: 4, path: 'flow',     component: 'project/flow',   perms: 'project:flow', icon: 'document', visible: '0', status: '0' },
    /* 综合运维 */
    { id: 5, parentId: 0, menuName: '综合运维',    menuType: 'M', orderNum: 5, path: '/ops', component: '', perms: '', icon: 'set-up', visible: '0', status: '0' },
    { id: 110, parentId: 5, menuName: '灯控策略',  menuType: 'C', orderNum: 1, path: 'light-strategy', component: 'ops/light-strategy', perms: 'ops:light-strategy', icon: 'clock', visible: '0', status: '0' },
    { id: 111, parentId: 5, menuName: '策略下发日志',menuType: 'C', orderNum: 2, path: 'log',   component: 'ops/log',         perms: 'ops:log:list', icon: 'document', visible: '0', status: '0' },
    /* 系统管理 */
    { id: 6, parentId: 0, menuName: '系统管理',    menuType: 'M', orderNum: 6, path: '/system', component: '', perms: '', icon: 'setting', visible: '0', status: '0' },
    { id: 200, parentId: 6, menuName: '组织管理',  menuType: 'C', orderNum: 1, path: 'org',      component: 'system/org',    perms: 'system:org:list', icon: 'office-building', visible: '0', status: '0' },
    { id: 201, parentId: 6, menuName: '用户管理',  menuType: 'C', orderNum: 2, path: 'user',     component: 'system/user',   perms: 'system:user:list', icon: 'user', visible: '0', status: '0' },
    { id: 202, parentId: 6, menuName: '角色管理',  menuType: 'C', orderNum: 3, path: 'role',     component: 'system/role',   perms: 'system:role:list', icon: 'user-filled', visible: '0', status: '0' },
    { id: 203, parentId: 6, menuName: '菜单管理',  menuType: 'C', orderNum: 4, path: 'menu',     component: 'system/menu',   perms: 'system:menu:list', icon: 'menu', visible: '0', status: '0' },
    /* 按钮权限示例 */
    { id: 1001, parentId: 200, menuName: '组织查询', menuType: 'F', orderNum: 1, path: '', component: '', perms: 'system:org:query',  icon: '#', visible: '0', status: '0' },
    { id: 1002, parentId: 200, menuName: '组织新增', menuType: 'F', orderNum: 2, path: '', component: '', perms: 'system:org:add',    icon: '#', visible: '0', status: '0' },
    { id: 1003, parentId: 200, menuName: '组织修改', menuType: 'F', orderNum: 3, path: '', component: '', perms: 'system:org:edit',   icon: '#', visible: '0', status: '0' },
    { id: 1004, parentId: 200, menuName: '组织删除', menuType: 'F', orderNum: 4, path: '', component: '', perms: 'system:org:remove', icon: '#', visible: '0', status: '0' },
    { id: 1005, parentId: 201, menuName: '用户查询', menuType: 'F', orderNum: 1, path: '', component: '', perms: 'system:user:query',  icon: '#', visible: '0', status: '0' },
    { id: 1006, parentId: 201, menuName: '用户新增', menuType: 'F', orderNum: 2, path: '', component: '', perms: 'system:user:add',    icon: '#', visible: '0', status: '0' },
    { id: 1007, parentId: 201, menuName: '用户修改', menuType: 'F', orderNum: 3, path: '', component: '', perms: 'system:user:edit',   icon: '#', visible: '0', status: '0' },
    { id: 1008, parentId: 201, menuName: '用户删除', menuType: 'F', orderNum: 4, path: '', component: '', perms: 'system:user:remove', icon: '#', visible: '0', status: '0' },
    { id: 1009, parentId: 201, menuName: '重置密码', menuType: 'F', orderNum: 5, path: '', component: '', perms: 'system:user:resetPwd', icon: '#', visible: '0', status: '0' },
    { id: 1010, parentId: 201, menuName: '分配角色', menuType: 'F', orderNum: 6, path: '', component: '', perms: 'system:user:assignRole', icon: '#', visible: '0', status: '0' },
    { id: 1011, parentId: 202, menuName: '角色查询', menuType: 'F', orderNum: 1, path: '', component: '', perms: 'system:role:query',  icon: '#', visible: '0', status: '0' },
    { id: 1012, parentId: 202, menuName: '角色新增', menuType: 'F', orderNum: 2, path: '', component: '', perms: 'system:role:add',    icon: '#', visible: '0', status: '0' },
    { id: 1013, parentId: 202, menuName: '角色修改', menuType: 'F', orderNum: 3, path: '', component: '', perms: 'system:role:edit',   icon: '#', visible: '0', status: '0' },
    { id: 1014, parentId: 202, menuName: '角色删除', menuType: 'F', orderNum: 4, path: '', component: '', perms: 'system:role:remove', icon: '#', visible: '0', status: '0' },
    { id: 2031, parentId: 203, menuName: '菜单查询', menuType: 'F', orderNum: 1, path: '', component: '', perms: 'system:menu:query',  icon: '#', visible: '0', status: '0' },
    { id: 2032, parentId: 203, menuName: '菜单新增', menuType: 'F', orderNum: 2, path: '', component: '', perms: 'system:menu:add',    icon: '#', visible: '0', status: '0' },
    { id: 2033, parentId: 203, menuName: '菜单修改', menuType: 'F', orderNum: 3, path: '', component: '', perms: 'system:menu:edit',   icon: '#', visible: '0', status: '0' },
    { id: 2034, parentId: 203, menuName: '菜单删除', menuType: 'F', orderNum: 4, path: '', component: '', perms: 'system:menu:remove', icon: '#', visible: '0', status: '0' },
    /* 系统运维 */
    { id: 500, parentId: 0, menuName: '系统运维',    menuType: 'M', orderNum: 7, path: '/monitor', component: '', perms: '', icon: 'data-line', visible: '0', status: '0' },
    { id: 5001, parentId: 500, menuName: '运维概览', menuType: 'C', orderNum: 1, path: 'overview', component: 'monitor/overview', perms: 'monitor:overview', icon: 'monitor', visible: '0', status: '0' },
    { id: 5002, parentId: 500, menuName: '日志管理', menuType: 'C', orderNum: 2, path: 'log', component: 'monitor/log', perms: 'monitor:log:list', icon: 'document', visible: '0', status: '0' },
    { id: 5003, parentId: 500, menuName: '监控告警', menuType: 'C', orderNum: 3, path: 'alert', component: 'monitor/alert', perms: 'monitor:alert:list', icon: 'warning', visible: '0', status: '0' },
    /* 按钮权限-灯杆管理 */
    { id: 5010, parentId: 104, menuName: '灯杆查询', menuType: 'F', orderNum: 1, path: '', component: '', perms: 'pole:query', icon: '#', visible: '0', status: '0' },
    { id: 5015, parentId: 104, menuName: '灯杆新增', menuType: 'F', orderNum: 2, path: '', component: '', perms: 'pole:add', icon: '#', visible: '0', status: '0' },
    { id: 5016, parentId: 104, menuName: '灯杆修改', menuType: 'F', orderNum: 3, path: '', component: '', perms: 'pole:edit', icon: '#', visible: '0', status: '0' },
    { id: 5017, parentId: 104, menuName: '灯杆删除', menuType: 'F', orderNum: 4, path: '', component: '', perms: 'pole:remove', icon: '#', visible: '0', status: '0' },
    { id: 5018, parentId: 104, menuName: '批量开关灯', menuType: 'F', orderNum: 5, path: '', component: '', perms: 'pole:batchSwitch', icon: '#', visible: '0', status: '0' },
  ];

  /* ============== 工具函数 ============== */

  /** 获取租户 */
  function getTenant(tenantId) {
    return TENANTS.find(t => t.id === tenantId);
  }

  /** 获取租户的原始配额 */
  function getTenantQuota(tenantId) {
    return TENANT_QUOTAS.find(q => q.tenantId === tenantId);
  }

  /** 计算租户的可用配额（含分销关系）
   * available = selfQuota - selfPoleUsed + Σ(收到 active 的 poleQuota) - Σ(分出 active 的 poleQuota)
   * 注意：分出配额时，分出方尚未消耗，所以"已分出"是从"可用"中扣除的
   */
  function getAvailableQuota(tenantId) {
    const quota = getTenantQuota(tenantId);
    if (!quota) return { pole: 0, project: 0 };
    const received = PROJECT_ALLOCATIONS
      .filter(a => a.toTenantId === tenantId && a.status === 'active')
      .reduce((s, a) => ({ pole: s.pole + a.poleQuota, project: s.project + a.projectQuota }), { pole: 0, project: 0 });
    const granted = PROJECT_ALLOCATIONS
      .filter(a => a.fromTenantId === tenantId && a.status === 'active')
      .reduce((s, a) => ({ pole: s.pole + a.poleQuota, project: s.project + a.projectQuota }), { pole: 0, project: 0 });
    return {
      pole: quota.poleTotal - quota.poleUsed + received.pole - granted.pole,
      project: quota.projectTotal - quota.projectUsed + received.project - granted.project,
    };
  }

  /** 获取租户下所有组织 */
  function getOrgsByTenant(tenantId) {
    return ORGANIZATIONS.filter(o => o.tenantId === tenantId);
  }

  /** 获取租户下所有项目 */
  function getProjectsByTenant(tenantId) {
    return PROJECTS.filter(p => p.tenantId === tenantId);
  }

  /* ============== 统一菜单定义 ==============
   * 数据结构：每个 group 含 title/icon/open/items
   * items 数组中可混用字符串（旧格式，自动查 SUBMENU_ICONS）和 { name, icon, href } 对象
   * 通过 getMenuGroups() 获取统一菜单；getSubmenuIcon(name) 查子菜单图标
   */
  const SUBMENU_ICONS = {
    '首页': 'HomeFilled',
    '产品分类': 'Collection',
    '产品管理': 'Goods',
    '设备管理': 'Cpu',
    '设备分组': 'Folder',
    '灯杆管理': 'Sunny',
    '太阳能照明': 'Sunrise',
    '智慧网关': 'Connection',
    '视频监控': 'VideoCamera',
    'LED显示屏': 'Monitor',
    '公共广播': 'Bell',
    '环境监测': 'Aim',
    '无线网络': 'Position',
    '智慧充电桩': 'Cellphone',
    '一键呼叫': 'Phone',
    '井盖管理': 'Location',
    '电缆防盗': 'Lock',
    '集中管理器': 'Grid',
    '灯控策略': 'Clock',
    '项目列表': 'Files',
    '项目分配': 'Share',
    '配额看板': 'DataAnalysis',
    '分配流水': 'Document',
    '资产分配': 'Share',
    '策略下发日志': 'Document',
    '组织管理': 'OfficeBuilding',
    '分级管理': 'Operation',
    '用户管理': 'User',
    '角色管理': 'UserFilled',
    '菜单管理': 'Menu',
    '区域管理': 'Location',
    '点位管理': 'LocationInformation',
    '流程定义': 'Connection',
    '我的待办': 'Tickets',
    '运维概览': 'Monitor',
    '日志管理': 'Document',
    '监控告警': 'Warning',
    '策略管理': 'SetUp',
  };

  const MENU_GROUPS = [
    { title: '首页', icon: 'HomeFilled', open: true, items: ['首页'], singleLink: true },
    { title: '设备管理', icon: 'Monitor', open: true, items: ['产品分类','产品管理','设备管理','设备分组'] },
    { title: '智慧灯杆', icon: 'Sunny', open: true, items: ['灯杆管理','灯控策略'] },
    { title: '项目管理', icon: 'Folder', open: true, items: ['项目列表','项目分配','配额看板','分配流水'] },
    { title: '综合运维', icon: 'SetUp', open: true, items: ['资产分配','策略下发日志'] },
    { title: '系统运维', icon: 'DataLine', open: false, items: ['运维概览','日志管理','监控告警'] },
    { title: '系统管理', icon: 'Setting', open: false, items: ['组织管理','分级管理','用户管理','角色管理','菜单管理'] },
    { title: '基础设施', icon: 'OfficeBuilding', open: false, items: ['区域管理','点位管理'] },
    { title: '工作流程', icon: 'Connection', open: false, items: ['流程定义','我的待办'] },
  ];

  function getSubmenuIcon(name) {
    return SUBMENU_ICONS[name] || null;
  }

  function getMenuGroups() {
    return MENU_GROUPS;
  }

  /** 递归获取所有子孙组织 ID（含自身） */
  function getDescendantOrgIds(orgId, orgs) {
    const result = [orgId];
    orgs.filter(o => o.parentId === orgId).forEach(c => {
      result.push(...getDescendantOrgIds(c.id, orgs));
    });
    return result;
  }

  /** 计算用户可见的组织 ID 列表（向下递归） */
  function visibleOrgIdsFor(userId, orgUsers, orgs) {
    const myOrgIds = orgUsers.filter(x => x.userId === userId).map(x => x.orgId);
    const all = [];
    myOrgIds.forEach(oid => {
      all.push(...getDescendantOrgIds(oid, orgs));
    });
    return [...new Set(all)];
  }

  /** 计算用户可见的项目 */
  function visibleProjectsFor(userId, ctx) {
    const orgIds = visibleOrgIdsFor(userId, ctx.orgUsers, ctx.orgs);
    return ctx.projects.filter(p => orgIds.includes(p.orgId) && p.tenantId === ctx.currentTenantId);
  }

  /** 计算用户可见的灯杆 */
  function visiblePolesFor(userId, ctx) {
    const projIds = visibleProjectsFor(userId, ctx).map(p => p.id);
    return ctx.poles.filter(p => projIds.includes(p.projectId) && p.tenantId === ctx.currentTenantId);
  }

  /** 计算项目已用配额（通过该项目的灯杆数） */
  function calcProjectPoleUsed(projectId, poles) {
    return poles.filter(p => p.projectId === projectId).length;
  }

  /** 计算租户已用路灯配额（通过该租户的所有灯杆） */
  function calcTenantPoleUsed(tenantId, poles) {
    return poles.filter(p => p.tenantId === tenantId).length;
  }

  /** 计算租户已用项目配额 */
  function calcTenantProjectUsed(tenantId) {
    return PROJECTS.filter(p => p.tenantId === tenantId).length;
  }

  /* ============== IoT：产品分类 Seed ============== */
  const PRODUCT_CATEGORIES = [
    { id: 1, name: '智慧灯杆',   parentId: null, sort: 1, icon: 'Sunny' },
    { id: 2, name: '智慧网关',   parentId: null, sort: 2, icon: 'Connection' },
    { id: 3, name: '视频监控',   parentId: null, sort: 3, icon: 'VideoCamera' },
    { id: 4, name: 'LED 显示屏', parentId: null, sort: 4, icon: 'Monitor' },
    { id: 5, name: '环境监测',   parentId: null, sort: 5, icon: 'DataLine' },
    { id: 6, name: '智慧充电桩', parentId: null, sort: 6, icon: 'Lightning' },
    { id: 11, name: '标准型', parentId: 1, sort: 1, icon: 'Sunny' },
    { id: 12, name: '经济型', parentId: 1, sort: 2, icon: 'Sunny' },
    { id: 13, name: '旗舰型', parentId: 1, sort: 3, icon: 'Sunny' },
  ];

  /* ============== IoT：产品 Seed（含物模型） ============== */
  const PRODUCTS = [
    { id: 1, name: '智慧灯杆-标准型', categoryId: 11, productKey: 'LP-STD-001', icon: 'Sunny', description: '面向市政道路的标准化智慧灯杆', status: '0', networkType: '4G', authType: 'one-device-one-secret', thingModel: { properties: [
      { name: '电压', identifier: 'voltage', accessType: 'r', required: false, dataType: 'float', specs: { min: 0, max: 300, unit: 'V' } },
      { name: '电流', identifier: 'current', accessType: 'r', required: false, dataType: 'float', specs: { min: 0, max: 10, unit: 'A' } },
      { name: '功率', identifier: 'power', accessType: 'r', required: false, dataType: 'float', specs: { min: 0, max: 500, unit: 'W' } },
      { name: '功率因数', identifier: 'pf', accessType: 'r', required: false, dataType: 'float', specs: { min: 0, max: 1 } },
      { name: '亮度', identifier: 'brightness', accessType: 'rw', required: true, dataType: 'int', specs: { min: 0, max: 100, unit: '%' } },
      { name: '色温', identifier: 'cct', accessType: 'rw', required: false, dataType: 'int', specs: { min: 2700, max: 6500, unit: 'K' } },
      { name: '芯片温度', identifier: 'temperature', accessType: 'r', required: false, dataType: 'float', specs: { min: -40, max: 85, unit: '℃' } },
      { name: '信号质量', identifier: 'signal', accessType: 'r', required: false, dataType: 'int', specs: { min: 0, max: 31 } },
      { name: '开关状态', identifier: 'switch_state', accessType: 'rw', required: true, dataType: 'bool', specs: {} },
      { name: '告警', identifier: 'alarm', accessType: 'r', required: false, dataType: 'enum', specs: { options: [{label:'正常',value:0},{label:'告警',value:1}] } },
    ], services: [
      { name: '开关灯', identifier: 'switch', callType: 'async', inputs: [{ name: 'on', dataType: 'bool' }], output: [] },
      { name: '调光', identifier: 'dim', callType: 'async', inputs: [{ name: 'level', dataType: 'int' }], output: [] },
    ], events: [
      { name: '故障告警', identifier: 'fault', level: 'error', output: [{ name: 'reason', dataType: 'text' }] },
    ], topics: { post: '/sys/{productKey}/{deviceCode}/event/post', reply: '/sys/{productKey}/{deviceCode}/event/reply', subscribe: '/sys/{productKey}/{deviceCode}/event/+' } } },
    { id: 2, name: '智慧灯杆-经济型', categoryId: 12, productKey: 'LP-ECO-002', icon: 'Sunny', description: '低成本款', status: '0', networkType: 'WiFi', authType: 'one-device-one-secret', thingModel: { properties: [{ name: '亮度', identifier: 'brightness', accessType: 'rw', dataType: 'int', specs: { min: 0, max: 100 } }], services: [], events: [], topics: {} } },
    { id: 3, name: '智慧灯杆-旗舰型', categoryId: 13, productKey: 'LP-FLA-003', icon: 'Sunny', description: '高端款', status: '0', networkType: '4G', authType: 'dynamic', thingModel: { properties: [], services: [], events: [], topics: {} } },
    { id: 4, name: '智慧网关',   categoryId: 2, productKey: 'GW-001',  icon: 'Connection', description: '通用物联网网关', status: '0', networkType: 'Ethernet', authType: 'one-device-one-secret', thingModel: { properties: [], services: [], events: [], topics: {} } },
    { id: 5, name: '视频监控',   categoryId: 3, productKey: 'CAM-001', icon: 'VideoCamera', description: '高清摄像头', status: '0', networkType: 'WiFi', authType: 'one-device-one-secret', thingModel: { properties: [], services: [], events: [], topics: {} } },
    { id: 6, name: 'LED 显示屏', categoryId: 4, productKey: 'LED-001', icon: 'Monitor', description: '户外 LED 屏', status: '0', networkType: '4G', authType: 'one-device-one-secret', thingModel: { properties: [], services: [], events: [], topics: {} } },
    { id: 7, name: '环境监测',   categoryId: 5, productKey: 'ENV-001', icon: 'DataLine', description: '温湿度/PM2.5', status: '0', networkType: '4G', authType: 'one-device-one-secret', thingModel: { properties: [], services: [], events: [], topics: {} } },
    { id: 8, name: '智慧充电桩', categoryId: 6, productKey: 'CHG-001', icon: 'Lightning', description: '电动汽车充电桩', status: '0', networkType: '4G', authType: 'one-device-one-secret', thingModel: { properties: [], services: [], events: [], topics: {} } },
  ];

  /* ============== IoT：设备分组 Seed（树形 3 层） ============== */
  const DEVICE_GROUPS = [
    { id: 1, name: '华东大区', parentId: null, sort: 1, owner: 'admin', remark: '华东区域设备' },
    { id: 2, name: '上海',     parentId: 1,    sort: 1, owner: 'admin', remark: '' },
    { id: 3, name: '苏州',     parentId: 1,    sort: 2, owner: 'admin', remark: '' },
    { id: 4, name: '杭州',     parentId: 1,    sort: 3, owner: 'admin', remark: '' },
    { id: 5, name: '浦东园区', parentId: 2,    sort: 1, owner: 'admin', remark: '' },
    { id: 6, name: '虹桥园区', parentId: 2,    sort: 2, owner: 'admin', remark: '' },
    { id: 7, name: '苏州工业园区', parentId: 3, sort: 1, owner: 'admin', remark: '' },
    { id: 8, name: '华南大区', parentId: null, sort: 2, owner: 'admin', remark: '华南区域设备' },
    { id: 9, name: '广州',     parentId: 8,    sort: 1, owner: 'admin', remark: '' },
    { id: 10, name: '深圳',    parentId: 8,    sort: 2, owner: 'admin', remark: '' },
    { id: 11, name: '天河区',  parentId: 9,    sort: 1, owner: 'admin', remark: '' },
    { id: 12, name: '南沙区',  parentId: 9,    sort: 2, owner: 'admin', remark: '' },
    { id: 13, name: '前海合作区', parentId: 10, sort: 1, owner: 'admin', remark: '' },
    { id: 14, name: '华北大区', parentId: null, sort: 3, owner: 'admin', remark: '华北区域设备' },
    { id: 15, name: '北京',     parentId: 14,   sort: 1, owner: 'admin', remark: '' },
    { id: 16, name: '海淀',     parentId: 15,   sort: 1, owner: 'admin', remark: '' },
    { id: 17, name: '华中大区', parentId: null, sort: 4, owner: 'admin', remark: '' },
    { id: 18, name: '武汉',     parentId: 17,   sort: 1, owner: 'admin', remark: '' },
    { id: 19, name: '智慧园区照明项目', parentId: null, sort: 5, owner: 'admin', remark: 'T1 项目 1' },
    { id: 20, name: '城市道路改造项目', parentId: null, sort: 6, owner: 'admin', remark: 'T1 项目 2' },
  ];

  /* ============== IoT：设备 Seed（148 条） ============== */
  const _deviceCodes = ['862041074724346','862041074848699','865743082867622','865743082882522','866522075609640','866522075661187','869978083918950','869978083926847','869978083928090','869978084012712','869978084012803','869978084253662'];
  const _createdDates = ['2025-12-20','2025-12-20','2026-03-13','2026-03-13','2026-01-27','2026-01-27','2026-05-21','2026-05-21','2026-05-21','2026-05-21','2026-05-21','2026-05-21'];
  const DEVICES = [];
  for (let i = 0; i < 148; i++) {
    const base = _deviceCodes[i % _deviceCodes.length];
    const code = i < 12 ? base : (Number(base) + i).toString();
    const status = i % 7 === 0 ? 'online' : 'offline';
    const groupId = ((i * 3) % 20) + 1;
    const productId = (i % 8) + 1;
    DEVICES.push({
      id: i + 1,
      name: code,
      code,
      deviceKey: 'DK' + code.substring(0, 6),
      deviceSecret: 'SK' + code.substring(8, 14) + i,
      tenantId: 'T1',
      productId,
      groupId,
      status,
      thingInstance: {
        voltage: 220 + (i % 10), current: +(0.5 + (i % 5) * 0.1).toFixed(2), power: 0, pf: 0.9,
        brightness: 80, cct: 4000, temperature: 26 + (i % 15), signal: 31,
        switch_state: status === 'online', alarm: 0,
      },
      location: { lng: '121.51292', lat: '31.225543', address: '上海' },
      createdAt: _createdDates[i % _createdDates.length] + ' 09:00:00',
      remark: '',
    });
  }

  /* ============== IoT 工具函数 ============== */
  function getProductsByCategory(categoryId) {
    if (categoryId == null) return PRODUCTS.slice();
    return PRODUCTS.filter(p => p.categoryId === categoryId);
  }

  /** 递归获取某分类的全部子孙分类 ID（含自身） */
  function getDescendantCategoryIds(categoryId, cats) {
    const ids = [categoryId];
    cats.filter(c => c.parentId === categoryId).forEach(c => ids.push(...getDescendantCategoryIds(c.id, cats)));
    return ids;
  }

  /** 取「智慧灯杆」产品线下的全部物联网产品（含标准型/经济型/旗舰型子分类），供灯杆管理引用 */
  function getPoleProducts() {
    const poleCatIds = getDescendantCategoryIds(1, PRODUCT_CATEGORIES); // 智慧灯杆(1) + 子分类 11/12/13
    return PRODUCTS.filter(p => poleCatIds.includes(p.categoryId));
  }

  function getDevicesByGroup(groupId, recursive) {
    if (groupId == null) return DEVICES.slice();
    if (!recursive) return DEVICES.filter(d => d.groupId === groupId);
    const groupIds = new Set([groupId]);
    const queue = [groupId];
    while (queue.length) {
      const id = queue.shift();
      DEVICE_GROUPS.filter(g => g.parentId === id).forEach(g => { groupIds.add(g.id); queue.push(g.id); });
    }
    return DEVICES.filter(d => groupIds.has(d.groupId));
  }

  function getGroupTree() {
    const map = new Map();
    DEVICE_GROUPS.forEach(g => map.set(g.id, { ...g, children: [] }));
    const roots = [];
    DEVICE_GROUPS.forEach(g => {
      if (g.parentId && map.has(g.parentId)) map.get(g.parentId).children.push(map.get(g.id));
      else roots.push(map.get(g.id));
    });
    return roots;
  }

  function getDeviceCountInGroup(groupId, recursive) {
    return getDevicesByGroup(groupId, recursive).length;
  }

  function moveDevicesToGroup(deviceIds, targetGroupId) {
    const set = new Set(deviceIds);
    let n = 0;
    DEVICES.forEach(d => { if (set.has(d.id)) { d.groupId = targetGroupId; n++; } });
    return n;
  }

  /* ============== 暴露到全局 ============== */
  global.SharedData = {
    TENANTS,
    TENANT_QUOTAS,
    ORGANIZATIONS,
    PROJECTS,
    PROJECT_ALLOCATIONS,
    DEPTS,
    USERS,
    ROLES,
    USER_ROLES,
    MENU_TREE,
    MENU_GROUPS,
    SUBMENU_ICONS,
    PRODUCT_CATEGORIES,
    PRODUCTS,
    DEVICE_GROUPS,
    DEVICES,
    // 工具函数
    getTenant,
    getTenantQuota,
    getAvailableQuota,
    getOrgsByTenant,
    getProjectsByTenant,
    getDescendantOrgIds,
    visibleOrgIdsFor,
    visibleProjectsFor,
    visiblePolesFor,
    calcProjectPoleUsed,
    calcTenantPoleUsed,
    calcTenantProjectUsed,
    getProductsByCategory,
    getPoleProducts,
    getDevicesByGroup,
    getGroupTree,
    getDeviceCountInGroup,
    moveDevicesToGroup,
    getSubmenuIcon,
    getMenuGroups,
  };


})(window);
