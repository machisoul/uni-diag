# 组件重构说明

## 重构概述

本次重构将原有的组件进行了拆分和优化，提取出了可复用的基础UI组件，提高了代码的复用性和可维护性。

## 组件结构

### 基础UI组件 (`src/components/ui/`)

这些是可复用的基础组件，可以在整个应用中使用：

#### Button 组件
- **文件**: `Button.tsx`
- **功能**: 通用按钮组件
- **属性**:
  - `variant`: "primary" | "secondary" | "danger" (默认: "primary")
  - `size`: "small" | "medium" | "large" (默认: "medium")
  - `children`: 按钮内容
  - 继承所有原生 button 属性

#### Input 组件
- **文件**: `Input.tsx`
- **功能**: 通用输入框组件
- **属性**:
  - `label`: 可选的标签文本
  - `error`: 可选的错误信息
  - `fullWidth`: 是否占满宽度
  - 继承所有原生 input 属性

#### Select 组件
- **文件**: `Select.tsx`
- **功能**: 通用选择器组件
- **属性**:
  - `label`: 可选的标签文本
  - `options`: 选项数组 `{value: string, label: string}[]`
  - `error`: 可选的错误信息
  - `fullWidth`: 是否占满宽度
  - 继承所有原生 select 属性

#### Fieldset 组件
- **文件**: `Fieldset.tsx`
- **功能**: 通用字段集组件
- **属性**:
  - `legend`: 可选的图例文本
  - `children`: 子组件
  - `className`: 可选的CSS类名

#### FormRow 组件
- **文件**: `FormRow.tsx`
- **功能**: 表单行布局组件
- **属性**:
  - `children`: 子组件
  - `gap`: "small" | "medium" | "large" (默认: "medium")
  - `className`: 可选的CSS类名

### 业务组件

#### EcuConnectionPanel
- **重构内容**: 使用基础UI组件重构，提高了代码的可读性和一致性
- **使用的基础组件**: Button, Input, Select, Fieldset, FormRow

#### BasicDiagnosisPanel
- **重构内容**: 使用 Fieldset 组件替换原生 fieldset
- **依赖**: FileInputRow 组件

#### FileInputRow
- **重构内容**: 使用基础UI组件重构，提高了组件的灵活性
- **使用的基础组件**: Button, Input, Select, FormRow

#### ActionLogPanel
- **重构内容**: 使用 Fieldset 组件，专注于操作日志显示
- **功能**:
  - 支持传入操作日志数据
  - 支持自定义高度
  - 更好的类型定义

#### DiagMsgPanel
- **新增组件**: 独立的诊断消息日志面板
- **功能**:
  - 支持不同类型的诊断消息（info、warning、error、success）
  - 支持自定义高度
  - 彩色类型标识
  - 与ActionLogPanel并排显示，支持桌面端和移动端布局

## 使用方式

### 导入基础组件
```typescript
import { Button, Input, Select, Fieldset, FormRow } from './components/ui';
```

### 导入业务组件
```typescript
import {
  EcuConnectionPanel,
  BasicDiagnosisPanel,
  ActionLogPanel,
  DiagMsgPanel
} from './components';
```

## 样式

- 基础UI组件的样式定义在 `src/components/ui/ui.css`
- 全局样式文件 `src/assets/styles/global.css` 导入了UI组件样式
- 保持了与原有样式的兼容性

## 优势

1. **可复用性**: 基础组件可以在多个地方使用
2. **一致性**: 统一的UI组件确保界面风格一致
3. **可维护性**: 组件职责清晰，易于维护和修改
4. **类型安全**: 完整的TypeScript类型定义
5. **扩展性**: 基础组件支持扩展和自定义
