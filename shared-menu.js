/* shared-menu.js
 * 统一侧边菜单：所有页面共用同一份菜单数据(MENU_DATA/MENU_HREF)与同一套菜单逻辑(createSharedSetup)。
 * 目的：1) 保证「工作台」在所有页面都出现；2) 统一样式与操作（展开持久化 / 点击跳转 / 图标）。
 * 仅依赖全局 Vue、ElementPlus、window.ElementPlusIconsVue、window.SharedData，不重复声明页面已解构的变量。
 */
(function () {
  'use strict';
  var Vue = window.Vue;
  var ref = Vue.ref, reactive = Vue.reactive, computed = Vue.computed;

  var MENU_DATA = [
    { title: '工作台', icon: 'HomeFilled', open: true, singleLink: true, items: ['工作台'] },
    { title: '设备管理', icon: 'Monitor', open: true,  items: ['产品分类','产品管理','设备管理','设备分组'] },
    { title: '智慧灯杆', icon: 'Sunny',   open: false, items: ['灯杆管理','太阳能照明','智慧网关','视频监控','LED显示屏','公共广播','环境监测','无线网络','智慧充电桩','一键呼叫','井盖管理','电缆防盗','集中管理器'] },
    { title: '项目管理', icon: 'Folder', open: true, items: ['项目列表','项目分配','配额看板','分配流水'] },
    { title: '综合运维', icon: 'SetUp',   open: true,  items: ['灯控策略','策略下发日志'] },
    { title: '系统运维', icon: 'DataLine',open: false, items: ['运维概览','日志管理','监控告警'] },
    { title: '系统管理', icon: 'Setting', open: false, items: ['组织管理','分级管理','用户管理','角色管理','菜单管理'] },
    { title: '基础设施', icon: 'OfficeBuilding', open: false, items: ['区域管理','点位管理'] },
    { title: '工作流程', icon: 'Connection', open: false, items: ['流程定义','我的待办'] }
  ];

  var MENU_HREF = {
    '首页': 'index.html',
    '工作台': 'index.html',
    '设备分组': 'device-group.html',
    '设备管理': 'device-management.html',
    '灯杆管理': 'pole-management.html',
    '太阳能照明': 'device-placeholder.html?type=solar',
    '智慧网关': 'device-placeholder.html?type=gateway',
    '视频监控': 'device-placeholder.html?type=camera',
    'LED显示屏': 'device-placeholder.html?type=led',
    '公共广播': 'device-placeholder.html?type=broadcast',
    '环境监测': 'device-placeholder.html?type=environment',
    '无线网络': 'device-placeholder.html?type=wifi',
    '智慧充电桩': 'device-placeholder.html?type=charging',
    '一键呼叫': 'device-placeholder.html?type=call',
    '井盖管理': 'device-placeholder.html?type=cover',
    '电缆防盗': 'device-placeholder.html?type=cable',
    '集中管理器': 'device-placeholder.html?type=controller',
    '灯控策略': 'light-strategy.html',
    '组织管理': 'organization-management.html',
    '分级管理': 'dept-management.html',
    '用户管理': 'user-management.html',
    '角色管理': 'role-management.html',
    '菜单管理': 'menu-management.html',
    '项目列表': 'project-management.html',
    '项目分配': 'project-management.html',
    '配额看板': 'project-management.html',
    '分配流水': 'project-management.html',
    '租户列表': 'tenant-management.html',
    '配额管理': 'tenant-management.html',
    '邀请码': 'tenant-management.html',
    '产品分类': 'product-management.html?tab=category',
    '产品管理': 'product-management.html?tab=product'
  };

  function createSharedSetup(activeMenuName) {
    var collapsed = ref(false);
    var mobileNav = ref(false);
    var activeMenu = ref(activeMenuName);
    var savedOpenState = localStorage.getItem('menuOpenState');
    var savedOpen = savedOpenState ? JSON.parse(savedOpenState) : {};
    var menuGroups = reactive(MENU_DATA.map(function (g) {
      return Object.assign({}, g, { open: savedOpen[g.title] !== undefined ? savedOpen[g.title] : g.open });
    }));
    var menuHref = MENU_HREF;

    var toggleGroup = function (g) {
      if (collapsed.value) { collapsed.value = false; g.open = true; }
      else { g.open = !g.open; }
      var openState = {};
      menuGroups.forEach(function (grp) { openState[grp.title] = grp.open; });
      localStorage.setItem('menuOpenState', JSON.stringify(openState));
    };

    var searchPop = ref(false);
    var navQuery = ref('');
    var allLeaves = MENU_DATA.reduce(function (acc, g) { return acc.concat(g.items); }, []);
    var navMatches = computed(function () {
      var q = navQuery.value.trim().toLowerCase();
      return q ? allLeaves.filter(function (n) { return n.toLowerCase().indexOf(q) !== -1; }) : allLeaves.slice(0, 8);
    });

    var jumpMenu = function (m) {
      var href = MENU_HREF[m];
      if (href) window.location.href = href;
      else if (window.ElementPlus) ElementPlus.ElMessage.info(m + ' 模块建设中');
      navQuery.value = ''; searchPop.value = false;
    };

    var toggleFull = function () {
      if (!document.fullscreenElement) { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }
      else { if (document.exitFullscreen) document.exitFullscreen(); }
    };

    var placeholder = function (m) {
      if (window.ElementPlus) ElementPlus.ElMessage.info((m || '该模块') + ' 建设中，敬请期待');
    };

    var onMenuClick = function (item, e) {
      var href = MENU_HREF[item];
      if (!href) { if (e && e.preventDefault) e.preventDefault(); placeholder(item); }
    };

    var iconComp = function (name) {
      return (window.ElementPlusIconsVue && window.ElementPlusIconsVue[name]) || null;
    };
    var submenuIcon = function (name) {
      return (window.SharedData && window.SharedData.SUBMENU_ICONS && window.SharedData.SUBMENU_ICONS[name]) || null;
    };
    /* 兼容 asset-assign 等页面的模板写法 */
    var getIcon = function (name) { return iconComp(name); };
    var getMenuIcon = function (item) { return submenuIcon(item); };

    var currentTenantId = ref(localStorage.getItem('currentTenantId') || 'T1');
    var tenantsOf = function () { return window.SharedData ? window.SharedData.TENANTS : []; };
    var currentTenantName = computed(function () {
      var t = tenantsOf().find(function (t) { return t.id === currentTenantId.value; });
      return t ? t.name : '未知租户';
    });
    var availableTenants = computed(function () { return tenantsOf(); });
    var switchTenant = function (id) {
      if (id === currentTenantId.value) return;
      currentTenantId.value = id;
      localStorage.setItem('currentTenantId', id);
      var name = tenantsOf().find(function (t) { return t.id === id; });
      if (window.ElementPlus) ElementPlus.ElMessage.success('已切换到租户：' + (name ? name.name : id));
      setTimeout(function () { window.location.reload(); }, 600);
    };

    return {
      collapsed: collapsed,
      mobileNav: mobileNav,
      activeMenu: activeMenu,
      menuGroups: menuGroups,
      menuHref: menuHref,
      toggleGroup: toggleGroup,
      searchPop: searchPop,
      navQuery: navQuery,
      navMatches: navMatches,
      jumpMenu: jumpMenu,
      toggleFull: toggleFull,
      currentTenantId: currentTenantId,
      currentTenantName: currentTenantName,
      availableTenants: availableTenants,
      switchTenant: switchTenant,
      SharedData: window.SharedData,
      placeholder: placeholder,
      onMenuClick: onMenuClick,
      iconComp: iconComp,
      submenuIcon: submenuIcon,
      getIcon: getIcon,
      getMenuIcon: getMenuIcon
    };
  }

  window.SharedMenu = { MENU_DATA: MENU_DATA, MENU_HREF: MENU_HREF, createSharedSetup: createSharedSetup };
  window.MENU_DATA = MENU_DATA;
  window.MENU_HREF = MENU_HREF;
  window.createSharedSetup = createSharedSetup;
})();
