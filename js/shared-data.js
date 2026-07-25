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
    '灯控策略': 'Clock',
    '项目列表': 'Files',
    '项目分配': 'Share',
    '配额看板': 'DataAnalysis',
    '分配流水': 'Document',
    '租户列表': 'OfficeBuilding',
    '配额管理': 'Histogram',
    '邀请码': 'Promotion',
    '资产分配': 'Share',
    '策略下发日志': 'Document',
    '组织管理': 'OfficeBuilding',
    '用户管理': 'User',
    '角色管理': 'UserFilled',
    '菜单管理': 'Menu',
    '区域管理': 'Location',
    '点位管理': 'LocationInformation',
    '流程定义': 'Connection',
    '我的待办': 'Tickets',
    '会员列表': 'User',
    '商品管理': 'Goods',
    '订单管理': 'List',
    '菜单配置': 'ChatDotRound',
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
    { title: '租户管理', icon: 'OfficeBuilding', open: false, items: ['租户列表','配额管理','邀请码'] },
    { title: '综合运维', icon: 'SetUp', open: true, items: ['资产分配','策略下发日志'] },
    { title: '系统运维', icon: 'DataLine', open: false, items: ['运维概览','日志管理','监控告警'] },
    { title: '系统管理', icon: 'Setting', open: false, items: ['组织管理','用户管理','角色管理','菜单管理'] },
    { title: '基础设施', icon: 'OfficeBuilding', open: false, items: ['区域管理','点位管理'] },
    { title: '工作流程', icon: 'Connection', open: false, items: ['流程定义','我的待办'] },
    { title: '会员中心', icon: 'User', open: false, items: ['会员列表'] },
    { title: '商城系统', icon: 'ShoppingCart', open: false, items: ['商品管理','订单管理'] },
    { title: '公众号管理', icon: 'ChatDotRound', open: false, items: ['菜单配置'] },
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

  /* ============== 暴露到全局 ============== */
  global.SharedData = {
    TENANTS,
    TENANT_QUOTAS,
    ORGANIZATIONS,
    PROJECTS,
    PROJECT_ALLOCATIONS,
    MENU_GROUPS,
    SUBMENU_ICONS,
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
    getSubmenuIcon,
    getMenuGroups,
  };

})(window);
