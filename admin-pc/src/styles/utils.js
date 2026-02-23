/**
 * 样式工具函数
 *
 * 功能：
 * 1. 提供主题变量的便捷访问
 * 2. 生成常用样式对象
 * 3. 响应式布局工具
 * 4. 动画效果工具
 */

import theme from '../theme';

/**
 * 获取颜色
 * @param {string} color - 颜色名称
 * @param {number|string} shade - 颜色深浅
 * @returns {string} 颜色值
 */
export const getColor = (color, shade = '500') => {
  if (theme.colors[color] && theme.colors[color][shade]) {
    return theme.colors[color][shade];
  }
  return theme.colors.neutral[shade] || '#000000';
};

/**
 * 获取间距
 * @param {string} size - 间距大小
 * @returns {string} 间距值
 */
export const getSpacing = (size = 'md') => {
  return theme.spacing[size] || '0px';
};

/**
 * 获取字体大小
 * @param {string} size - 字体大小
 * @returns {string} 字体大小值
 */
export const getFontSize = (size = 'md') => {
  return theme.typography.fontSize[size] || '16px';
};

/**
 * 获取字重
 * @param {string} weight - 字重
 * @returns {number} 字重值
 */
export const getFontWeight = (weight = 'normal') => {
  return theme.typography.fontWeight[weight] || 400;
};

/**
 * 获取圆角
 * @param {string} size - 圆角大小
 * @returns {string} 圆角值
 */
export const getBorderRadius = (size = 'md') => {
  return theme.borderRadius[size] || '4px';
};

/**
 * 获取阴影
 * @param {string} size - 阴影大小
 * @returns {string} 阴影值
 */
export const getShadow = (size = 'sm') => {
  return theme.shadows[size] || '0 0 0 rgba(0, 0, 0, 0)';
};

/**
 * 获取动画持续时间
 * @param {string} speed - 动画速度
 * @returns {string} 持续时间值
 */
export const getAnimationDuration = (speed = 'normal') => {
  return theme.animation.duration[speed] || '300ms';
};

/**
 * 获取动画缓动函数
 * @param {string} type - 缓动类型
 * @returns {string} 缓动函数值
 */
export const getAnimationTimingFunction = (type = 'easeInOut') => {
  return theme.animation.timingFunction[type] || 'cubic-bezier(0.4, 0, 0.2, 1)';
};

/**
 * 生成卡片样式
 * @param {Object} options - 选项
 * @returns {Object} 样式对象
 */
export const getCardStyle = (options = {}) => {
  const {
    padding = 'lg',
    marginBottom = 'lg',
    shadow = 'sm',
    borderRadius = 'lg',
  } = options;
  
  return {
    background: theme.colors.background.card,
    borderRadius: getBorderRadius(borderRadius),
    padding: getSpacing(padding),
    marginBottom: getSpacing(marginBottom),
    boxShadow: getShadow(shadow),
    transition: `all ${getAnimationDuration()} ${getAnimationTimingFunction()}`,
  };
};

/**
 * 生成按钮样式
 * @param {Object} options - 选项
 * @returns {Object} 样式对象
 */
export const getButtonStyle = (options = {}) => {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
  } = options;
  
  const sizeMap = {
    sm: {
      padding: '6px 12px',
      fontSize: getFontSize('sm'),
    },
    md: {
      padding: '8px 16px',
      fontSize: getFontSize('md'),
    },
    lg: {
      padding: '12px 24px',
      fontSize: getFontSize('lg'),
    },
  };
  
  const variantMap = {
    primary: {
      background: getColor('primary'),
      color: theme.colors.text.inverse,
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: getColor('primary'),
      border: `1px solid ${getColor('primary')}`,
    },
    danger: {
      background: getColor('error'),
      color: theme.colors.text.inverse,
      border: 'none',
    },
    outline: {
      background: 'transparent',
      color: getColor('neutral', '700'),
      border: `1px solid ${getColor('border', 'default')}`,
    },
  };
  
  return {
    ...sizeMap[size],
    ...variantMap[variant],
    borderRadius: getBorderRadius(),
    fontWeight: getFontWeight('medium'),
    cursor: 'pointer',
    transition: `all ${getAnimationDuration()} ${getAnimationTimingFunction()}`,
    textAlign: 'center',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: fullWidth ? '100%' : 'auto',
    
    '&:hover': {
      opacity: 0.8,
      transform: 'translateY(-1px)',
    },
    
    '&:active': {
      opacity: 0.9,
      transform: 'translateY(0)',
    },
    
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none',
    },
  };
};

/**
 * 生成输入框样式
 * @param {Object} options - 选项
 * @returns {Object} 样式对象
 */
export const getInputStyle = (options = {}) => {
  const {
    error = false,
    focus = false,
    disabled = false,
  } = options;
  
  return {
    width: '100%',
    padding: `${getSpacing('sm')} ${getSpacing('md')}`,
    fontSize: getFontSize(),
    fontWeight: getFontWeight(),
    lineHeight: theme.typography.lineHeight.normal,
    color: theme.colors.text.primary,
    background: theme.colors.background.card,
    border: `1px solid ${getColor('border', 'default')}`,
    borderRadius: getBorderRadius(),
    transition: `all ${getAnimationDuration()} ${getAnimationTimingFunction()}`,
    
    '&:focus': {
      outline: 'none',
      borderColor: getColor('primary'),
      boxShadow: `0 0 0 2px ${getColor('primary', '100')}`,
    },
    
    '&:hover': {
      borderColor: getColor('primary', '300'),
    },
    
    '&:disabled': {
      background: getColor('neutral', '100'),
      color: getColor('neutral', '400'),
      cursor: 'not-allowed',
    },
    
    ...(error && {
      borderColor: getColor('error'),
      '&:focus': {
        borderColor: getColor('error'),
        boxShadow: `0 0 0 2px ${getColor('error', '100')}`,
      },
    }),
  };
};

/**
 * 生成动画样式
 * @param {Object} options - 选项
 * @returns {Object} 样式对象
 */
export const getAnimationStyle = (options = {}) => {
  const {
    duration = 'normal',
    timingFunction = 'easeInOut',
    property = 'all',
  } = options;
  
  return {
    transition: `${property} ${getAnimationDuration(duration)} ${getAnimationTimingFunction(timingFunction)}`,
  };
};

/**
 * 生成响应式样式
 * @param {Object} breakpoints - 断点样式
 * @returns {Object} 响应式样式对象
 */
export const getResponsiveStyle = (breakpoints) => {
  const responsiveStyles = {};
  
  Object.entries(breakpoints).forEach(([breakpoint, styles]) => {
    if (theme.breakpoints[breakpoint]) {
      responsiveStyles[`@media (min-width: ${theme.breakpoints[breakpoint]})`] = styles;
    }
  });
  
  return responsiveStyles;
};

/**
 * 生成弹性布局样式
 * @param {Object} options - 选项
 * @returns {Object} 样式对象
 */
export const getFlexStyle = (options = {}) => {
  const {
    direction = 'row',
    justify = 'flex-start',
    align = 'stretch',
    wrap = 'nowrap',
    gap = 'md',
  } = options;
  
  return {
    display: 'flex',
    flexDirection: direction,
    justifyContent: justify,
    alignItems: align,
    flexWrap: wrap,
    gap: getSpacing(gap),
  };
};

/**
 * 生成网格布局样式
 * @param {Object} options - 选项
 * @returns {Object} 样式对象
 */
export const getGridStyle = (options = {}) => {
  const {
    columns = 1,
    gap = 'md',
    autoRows = 'auto',
  } = options;
  
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: getSpacing(gap),
    gridAutoRows: autoRows,
  };
};

/**
 * 生成阴影样式
 * @param {string} level - 阴影级别
 * @returns {Object} 样式对象
 */
export const getShadowStyle = (level = 'sm') => {
  return {
    boxShadow: getShadow(level),
  };
};

/**
 * 生成渐变背景
 * @param {string} direction - 渐变方向
 * @param {string[]} colors - 渐变颜色
 * @returns {string} 渐变背景值
 */
export const getGradient = (direction = 'to right', colors = ['#1890ff', '#096dd9']) => {
  return `linear-gradient(${direction}, ${colors.join(', ')})`;
};

/**
 * 生成文字截断样式
 * @param {number} lines - 显示行数
 * @returns {Object} 样式对象
 */
export const getTextTruncate = (lines = 1) => {
  if (lines === 1) {
    return {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };
  }
  
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
};

/**
 * 生成定位样式
 * @param {Object} options - 选项
 * @returns {Object} 样式对象
 */
export const getPositionStyle = (options = {}) => {
  const {
    position = 'relative',
    top,
    right,
    bottom,
    left,
    zIndex,
  } = options;
  
  return {
    position,
    ...(top !== undefined && { top }),
    ...(right !== undefined && { right }),
    ...(bottom !== undefined && { bottom }),
    ...(left !== undefined && { left }),
    ...(zIndex !== undefined && { zIndex }),
  };
};

export default {
  getColor,
  getSpacing,
  getFontSize,
  getFontWeight,
  getBorderRadius,
  getCardStyle,
  getButtonStyle,
  getInputStyle,
  getAnimationStyle,
  getResponsiveStyle,
  getFlexStyle,
  getGridStyle,
  getShadowStyle,
  getGradient,
  getTextTruncate,
  getPositionStyle,
};
