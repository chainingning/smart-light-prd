# 智慧灯杆运营大屏 — 接口缺口清单

> 更新：2026-08-08  
> 前端代码：`smart-pole/yudao-ui/yudao-ui-admin-vue3/src/views/smart-pole/big-screen/`  
> 路由：`/big-screen`  
> 数据入口：`composables/useBigScreenData.ts` + `composables/useGroupStats.ts`

---

## 一、现状总览

大屏当前 **没有专用后端接口**，通过 5 个现有 IoT 接口拉取数据后，在前端 `useGroupStats.ts` 中 **推导/估算** 大部分运营指标。

| 数据类别 | 当前来源 | 可信度 |
|---------|---------|--------|
| 地图点位、分组、产品类型 | 现有 API + 前端合并 | 中（见缺口） |
| 顶部 KPI（总数/在线率/亮灯率/故障数） | 前端计算 | 中 |
| KPI 环比箭头 | sessionStorage 前后对比 | 低（非真实历史） |
| 控灯策略 / 能耗 / 节费 / 工单 / 资产 / TOP 榜 | 前端推导或写死 | 低 |
| 环境监测（湿度/PM 等） | 部分假数据 | 低 |

---

## 二、已在用的接口（5 个）

| # | 前端调用 | 后端路径 | 大屏用途 | 存在问题 |
|---|---------|---------|---------|---------|
| 1 | `DeviceApi.getDeviceLocationList()` | `GET /iot/device/location-list` | 地图经纬度、设备状态、分组 | 不含 `switchOn`/`brightness`，需与灯杆表 merge |
| 2 | `LightPoleApi.getLightPolePage({ pageNo:1, pageSize:200 })` | `GET /iot/lightpole/page` | 灯杆电气数据、灯态、运行时长 | **仅取 200 条**，全量统计不准；无大屏轻量列表 |
| 3 | `DeviceGroupApi.getSimpleDeviceGroupList()` | `GET /iot/device-group/simple-list` | 控制条「分组」下拉 | 可用 |
| 4 | `ProductApi.getSimpleProductList()` | `GET /iot/product/simple-list` | 控制条「设备类型」筛选 | 可用 |
| 5 | `AlertRecordApi.getAlertRecordPage({ pageNo:1, pageSize:20 })` | `GET /iot/alert-record/page` | 实时告警、故障数 | **仅 20 条**；响应无 `groupId`，前端靠 deviceId 反查 |

### 2.1 现有接口需增强（不必新建模块）

| 接口 | 建议增强 | 原因 |
|-----|---------|------|
| `GET /iot/lightpole/page` | 增加 `GET /iot/lightpole/map-list` 或支持 `pageSize=-1` / 按分组导出 | 大屏需全量有坐标灯杆 |
| `GET /iot/alert-record/page` | 增加 `groupId` 筛选参数；响应补 `groupId` | 分组告警过滤 |
| `GET /iot/alert-record/page` | 增加 `status=unprocessed` + `limit=50` 快捷参数 | 告警面板需更多未处理记录 |
| `GET /iot/device/location-list` | 响应合并灯态字段（或文档说明与 lightpole 联查） | 减少前端双表 merge |

---

## 三、完全缺失的接口（按面板）

### P0 — 核心（没有则数据不可信）

#### 3.1 大屏聚合概览（推荐优先做 1 个顶多个）

```
GET /iot/big-screen/overview?groupId={groupId}
```

- `groupId=0` 表示「全部」，与前端 `activeGroupId` 一致
- 一次返回第三节末尾的 **完整响应结构**
- 前端改造：新增 `src/api/iot/big-screen/index.ts`，`useBigScreenData.ts` 替换 `buildGroupStats()` 推导

---

#### 3.2 按模块拆分（若不做聚合接口）

| # | 建议路径 | 面板/组件 | 缺失字段 | 当前前端兜底方式 |
|---|---------|----------|---------|----------------|
| 1 | `GET /iot/big-screen/kpi?groupId=` | `TopKpiBar` | `total, onlineRate, lightRate, faultCount, savingRate, trend.*` | 从 markers + alarms 计算；环比用 sessionStorage |
| 2 | `GET /iot/big-screen/markers?groupId=&productIds=` | 地图 | 见 [地图点位结构](#地图点位-bigscreenmarkervo) | merge location-list + lightpole/page |
| 3 | `GET /iot/big-screen/alarms?groupId=&limit=20` | `AlarmFeed` | `id, name, level, deviceId, groupId, processStatus, createTime` | alert-record/page 仅 20 条 |
| 4 | `GET /iot/big-screen/power-plan?groupId=` | `PowerPlanPanel` | `strategyName, timeRange, status, planKwh, actualKwh, completionRate` | 写死「分时调光模式 / 执行中」；kWh 用 power 粗估 |

**控灯策略可复用的后端模块**（已有但未接入大屏）：

- `GET /iot/strategy` — 策略列表（`LpStrategyController`）
- `GET /iot/strategy/dispatch` — 策略下发/执行（`StrategyDispatchController`）

需新增：**按分组查询当前生效策略 + 执行进度** 的聚合读接口。

---

### P1 — 运营统计

| # | 建议路径 | 面板/组件 | 缺失字段 | 当前前端兜底方式 |
|---|---------|----------|---------|----------------|
| 5 | `GET /iot/big-screen/assets?groupId=` | `AssetOverview` | `assets.*, solar.*, energy.co2Reduction, investedPoles, totalRevenueWan` | 按产品名正则计数；manhole 固定 0；收入用 `poleCount * 0.008` |
| 6 | `GET /iot/big-screen/energy/yearly?groupId=` | `YearlyEnergyPanel` | `[{ year, kwh, isYtd? }]` | 用当月 power 合计 × 系数伪造 3 年 |
| 7 | `GET /iot/big-screen/energy/monthly-compare?groupId=` | `MonthlyComparePanel` | `thisMonth, lastMonth, lastYear`（kWh） | 同上，lastMonth/lastYear 乘固定比例 |
| 8 | `GET /iot/big-screen/energy/saving?groupId=` | `TopKpiBar` + `CostSavingPanel` | `monthSaving, savingRate, totalSaving, yearSaving, totalSaving` | savingRate 公式 `12 + poleCount * 0.02` |
| 9 | `GET /iot/big-screen/top-list?groupId=` | `TopListPanel` | `topOffline[{name,hours}], topPower[{name,kwh}]` | 按 offlineTime、power 排序前 3 |

---

### P2 — 运维 / 环境 / 安全

| # | 建议路径 | 面板/组件 | 缺失字段 | 当前前端兜底方式 |
|---|---------|----------|---------|----------------|
| 10 | `GET /iot/big-screen/work-orders?groupId=` | `OpsHealthPanel` | `total, processing, completed, overtime, avgResponseMin, avgHandleMin, slaRate` | **用告警记录冒充工单**；SLA/响应时长写死 18/90min |
| 11 | `GET /iot/big-screen/device-health?groupId=` | `OpsHealthPanel` | `needMaintenance, nearEndOfLife, avgRunHours` | runHours > 8000/15000 阈值判断 |
| 12 | `GET /iot/big-screen/environment?groupId=` | `EnvironmentPanel` | `online, offline, fault, temp, humidity, windSpeed, pressure, pm25, pm10` | 湿度/风速/气压/PM 为 **固定假值**；temp 仅灯杆温度均值 |
| 13 | `GET /iot/big-screen/safety?groupId=` | `CostSavingPanel` | `leakageTrips, voltageAnomalies, currentAnomalies` | 漏电固定 0；电压/电流阈值判断 |
| 14 | `GET /iot/big-screen/lighting-summary?groupId=` | `EnvironmentPanel` 内照明行 | `off, low, mid, high, full` | 前端按 brightness 分段 |

---

## 四、面板 → 字段 → 接口映射表

| UI 区域 | 组件文件 | 关键字段 | 应有接口 | 优先级 |
|--------|---------|---------|---------|--------|
| 顶栏 KPI 条 | `TopKpiBar.vue` | 灯杆总数、在线率、亮灯率、故障数、节能率、环比 | `/big-screen/kpi` 或 overview | P0 |
| 控制条-分组 | `ControlBar.vue` | 分组列表 | 已有 `/iot/device-group/simple-list` | — |
| 控制条-类型 | `ControlBar.vue` | 产品列表 | 已有 `/iot/product/simple-list` | — |
| 地图 | `useBigScreenMap.ts` | 点位坐标、灯态、在线 | `/big-screen/markers` 或增强 location-list | P0 |
| 控灯策略 | `PowerPlanPanel.vue` | 策略名、时段、完成率 | `/big-screen/power-plan` + 策略模块 | P0 |
| 实时告警 | `AlarmFeed.vue` | 告警列表 | `/big-screen/alarms` 或增强 alert-record | P0 |
| 环境监测 | `EnvironmentPanel.vue` | 照明分级 + 6 项传感数据 | `/big-screen/environment` + lighting-summary | P2 |
| 视图摘要 | `MapInfoPanel.vue` | 设备数、在线数 | 可由 markers 接口派生 | P0 |
| 资产总览 | `AssetOverview.vue` | 12 类资产 + 太阳能 + CO₂ + 运营收入 | `/big-screen/assets` | P1 |
| TOP 榜单 | `TopListPanel.vue` | 离线 TOP3、耗电 TOP3 | `/big-screen/top-list` | P1 |
| 运维健康度 | `OpsHealthPanel.vue` | 工单 + 设备健康 | `/big-screen/work-orders` + device-health | P2 |
| 年度能耗 | `YearlyEnergyPanel.vue` | 3 年 kWh 柱图 | `/big-screen/energy/yearly` | P1 |
| 当月对比 | `MonthlyComparePanel.vue` | 本月/上月/去年同期 | `/big-screen/energy/monthly-compare` | P1 |
| 节费与安全 | `CostSavingPanel.vue` | 节费金额 + 安全次数 | `/big-screen/energy/saving` + safety | P1/P2 |

---

## 五、推荐聚合响应结构

```typescript
/** GET /iot/big-screen/overview?groupId=0 */
interface BigScreenOverviewVO {
  /** 顶部 KPI */
  kpi: {
    total: number
    onlineRate: number       // %
    lightRate: number        // %
    faultCount: number       // 未处理故障数
    savingRate: number       // 节能率 %
  }
  /** 较上一周期环比（正=升，负=降） */
  trend: {
    onlineRate: number
    lightRate: number
    faultCount: number
    savingRate: number
  }

  /** 地图点位（也可独立接口，见下） */
  markers: BigScreenMarkerVO[]

  /** 控灯策略 */
  powerPlan: {
    strategyName: string
    timeRange: string
    status: string           // 执行中 | 已暂停 | 未配置
    planKwh: number
    actualKwh: number
    completionRate: number   // %
  }

  /** 实时告警（建议最多 20 条，未处理优先） */
  alarms: {
    id: number
    name: string
    level: number            // 1 | 2 | 3
    deviceId: number
    groupId: number
    processStatus: boolean
    createTime: string
  }[]

  /** 照明分级 */
  lightingSummary: {
    total: number
    off: number
    low: number
    mid: number
    high: number
    full: number
  }

  /** 环境监测，无传感器时为 null */
  environment: {
    online: number
    offline: number
    fault: number
    temp: number             // ℃
    humidity: number         // %Rh
    windSpeed: number        // m/s
    pressure: number         // KPa
    pm25: number             // ug/m³
    pm10: number
  } | null

  /** 资产总览 */
  assets: {
    pole: number
    gateway: number
    solarPanel: number
    singleCtrl: number
    led: number
    envMonitor: number
    manhole: number
    camera: number
    base5g: number
    chargePile: number
  }
  solar: {
    total: number
    discharge: number
    online: number
    fault: number
  }
  energy: {
    monthSaving: number      // kWh
    savingRate: number       // %
    totalSaving: number
    co2Reduction: number     // kg
  }
  investedPoles: number
  totalRevenueWan: number    // 万元

  /** TOP 榜单 */
  topOffline: { poleId: number; name: string; hours: number }[]
  topPower: { poleId: number; name: string; kwh: number }[]

  /** 运维健康度 */
  workOrders: {
    total: number
    processing: number
    completed: number
    overtime: number
    avgResponseMin: number
    avgHandleMin: number
    slaRate: number          // %
  }
  deviceHealth: {
    needMaintenance: number
    nearEndOfLife: number
    avgRunHours: number
  }

  /** 节费与安全 */
  costSaving: {
    yearSaving: number       // 元
    totalSaving: number
  }
  safety: {
    leakageTrips: number
    voltageAnomalies: number
    currentAnomalies: number
  }

  /** 能耗图表 */
  monthlyCompare: {
    thisMonth: number        // kWh
    lastMonth: number
    lastYear: number
  }
  yearlyEnergy: {
    year: string
    kwh: number
    isYtd?: boolean          // 当年柱标记「本年至今」
  }[]
}
```

### 地图点位 `BigScreenMarkerVO`

```typescript
interface BigScreenMarkerVO {
  id: number
  deviceId?: number
  poleId?: number
  name: string
  lng: number
  lat: number
  online: boolean            // 通信在线
  switchOn?: boolean
  brightness?: number        // 0-100
  level: 'off' | 'low' | 'mid' | 'high' | 'full'
  productId?: number
  productName?: string
  groupIds?: number[]
  groupName?: string
}
```

独立地图接口（点位多时 overview 可不含 markers）：

```
GET /iot/big-screen/markers?groupId=0&productIds=1,2
```

---

## 六、前端推导逻辑说明（后端需覆盖的部分）

以下为 `useGroupStats.ts` 中的推导规则，**接口就绪后应删除**：

| 模块 | 推导规则 | 建议真实数据来源 |
|-----|---------|----------------|
| 节能率 | `12 + poleCount * 0.02`，上限 28% | 能耗计量 / EMC 合同算法 |
| 日耗电 | `sum(power) * 10` | 电表 / 设备上报累计电量 |
| 年度能耗 | 当月 × 12 × 固定系数 | 历史能耗台账 |
| 环比 trend | sessionStorage 与上次刷新对比 | 服务端日快照 / 定时任务 |
| 资产 LED/摄像头等 | 产品名正则匹配 | 资产台账按 productType 统计 |
| 工单 | 告警数 = 工单数 | 独立工单系统 |
| 环境 PM/湿度 | 固定值 55/25/40 等 | 环境传感器物模型 |
| 策略 | 写死「分时调光模式」 | `/iot/strategy` 当前生效策略 |
| 离线 TOP | 按 `offlineTime` 排序 | 同上，服务端排序 |
| 耗电 TOP | 按 `power` 排序 × 10 | 日用电量统计 |

---

## 七、实施建议

### 阶段 1（可快速上线）

1. `GET /iot/big-screen/overview?groupId=` — 返回 P0 + P1 核心字段
2. 增强 `GET /iot/lightpole/map-list` — 全量有坐标灯杆
3. 增强 `GET /iot/alert-record/page` — 补 `groupId`、支持分组筛选

### 阶段 2（数据准确）

4. 接入策略模块 — powerPlan 真实数据
5. 能耗/节费 — 对接电表或计量服务
6. TOP 榜 — 服务端预聚合

### 阶段 3（运维完整）

7. 工单系统 — 替换告警冒充
8. 环境传感器 — 独立 environment 聚合
9. 用电安全事件 — safety 统计

### 前端对接点（接口 ready 后）

| 文件 | 改动 |
|-----|------|
| 新建 `src/api/iot/big-screen/index.ts` | 定义 API + TS 类型 |
| `useBigScreenData.ts` | `loadData()` 改调 overview；删除 5 接口并行 + mergeMarkers |
| `useGroupStats.ts` | 删除 `buildGroupStats()`，或仅保留格式化工具 |
| `types.ts` | 与后端 VO 对齐 |

---

## 八、相关后端模块参考

| 模块 | 路径前缀 | 与大屏关系 |
|-----|---------|-----------|
| 灯杆 | `/iot/lightpole` | 点位、电气、运行时长 |
| 设备 | `/iot/device` | 在线状态、坐标 |
| 分组 | `/iot/device-group` | 分组筛选 |
| 产品 | `/iot/product` | 类型筛选 |
| 告警 | `/iot/alert-record` | 故障/告警 |
| 控灯策略 | `/iot/strategy`、`/iot/strategy/dispatch` | 策略执行状态（未接入大屏） |

---

## 九、检查清单（后端完成度自检）

- [ ] 分组切换 `groupId=0/1/2/...` 全链路数据一致
- [ ] 灯杆总数与地图点位数口径说明（有坐标 vs 全量）
- [ ] 告警 `groupId` 可直接筛选，无需前端反查
- [ ] 节能率/节费有业务公式文档，非前端估算
- [ ] 年度能耗当年柱带 `isYtd=true`
- [ ] 无环境传感器时分组返回 `environment: null`
- [ ] 控灯策略无配置时 `powerPlan.status = "未配置"`
- [ ] 工单与告警分离（若两套系统并存，字段勿混用）
