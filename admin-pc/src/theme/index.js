/**
 * 设计语言系统 - 主题配置
 *
 * 功能：
 * 1. 统一颜色系统
 * 2. 字体配置
 * 3. 间距系统
 * 4. 组件样式变量
 * 5. 动画配置
 *
 * @module theme
 */

// 主色调
export const colors = {
  // 品牌色
  primary: {
    50: '#e6f7ff',
    100: '#bae7ff',
    200: '#91d5ff',
    300: '#69c0ff',
    400: '#40a9ff',
    500: '#1890ff', // 主色
    600: '#096dd9',
    700: '#0050b3',
    800: '#003a8c',
    900: '#002766',
  },
  
  // 功能色
  success: {
    50: '#f6ffed',
    100: '#d9f7be',
    200: '#b7eb8f',
    300: '#95de64',
    400: '#73d13d',
    500: '#52c41a', // 成功色
    600: '#389e0d',
    700: '#237804',
    800: '#135200',
    900: '#052f00',
  },
  
  warning: {
    50: '#fff7e6',
    100: '#ffd591',
    200: '#ffc069',
    300: '#ffa940',
    400: '#ff9c1a',
    500: '#fa8c16', // 警告色
    600: '#d46b08',
    700: '#ad4e00',
    800: '#873800',
    900: '#612500',
  },
  
  error: {
    50: '#fff1f0',
    100: '#ffccc7',
    200: '#ff9a9e',
    300: '#ff6b72',
    400: '#ff4d4f',
    500: '#f5222d', // 错误色
    600: '#cf1322',
    700: '#a8071a',
    800: '#820014',
    900: '#5c0011',
  },
  
  // 中性色
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e8e8e8',
    300: '#d9d9d9',
    400: '#bfbfbf',
    500: '#8c8c8c',
    600: '#595959',
    700: '#434343',
    800: '#262626',
    900: '#1f1f1f',
    1000: '#000000',
  },
  
  // 背景色
  background: {
    page: '#f0f2f5',
    card: '#ffffff',
    hover: '#f5f5f5',
    active: '#e6f7ff',
  },
  
  // 文本色
  text: {
    primary: '#262626',
    secondary: '#595959',
    disabled: '#bfbfbf',
    inverse: '#ffffff',
  },
  
  // 边框色
  border: {
    light: '#e8e8e8',
    default: '#d9d9d9',
    dark: '#bfbfbf',
  },
};

// 字体配置
export const typography = {
  fontFamily: {
    primary: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    code: "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, Courier, monospace",
  },
  
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    xxl: '24px',
    xxxl: '30px',
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

// 间距系统
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px',
};

// 圆角系统
export const borderRadius = {
  sm: '2px',
  md: '4px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
};

// 阴影系统
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
};

// 动画配置
export const animation = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  timingFunction: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },
};

// Z-index 层级
export const zIndex = {
  base: 0,
  dropdown: 1050,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// 断点配置
export const breakpoints = {
  xs: '480px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1600px',
};

// 导出默认主题
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  zIndex,
  breakpoints,
};
