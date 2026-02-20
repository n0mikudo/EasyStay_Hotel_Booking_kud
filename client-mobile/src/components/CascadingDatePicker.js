/**
 * 级联年月日日期选择器
 * 三列滚轮：年、月、日
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { PickerView, Popup } from 'antd-mobile';
import './CascadingDatePicker.css';

// 生成年份选项（当前年 ± 2年）
const getYears = (minDate, maxDate) => {
  const minY = minDate.getFullYear();
  const maxY = maxDate.getFullYear();
  const years = [];
  for (let y = minY; y <= maxY; y++) {
    years.push({ label: `${y}年`, value: y });
  }
  return years;
};

// 生成月份选项
const getMonths = (year, minDate, maxDate) => {
  let minM = 1, maxM = 12;
  if (year === minDate.getFullYear()) minM = minDate.getMonth() + 1;
  if (year === maxDate.getFullYear()) maxM = maxDate.getMonth() + 1;
  const months = [];
  for (let m = minM; m <= maxM; m++) {
    months.push({ label: `${m}月`, value: m });
  }
  return months;
};

// 生成日期选项（根据年月）
const getDays = (year, month, minDate, maxDate) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let minD = 1, maxD = daysInMonth;
  const date = new Date(year, month - 1, 1);
  if (year === minDate.getFullYear() && month === minDate.getMonth() + 1) {
    minD = minDate.getDate();
  }
  if (year === maxDate.getFullYear() && month === maxDate.getMonth() + 1) {
    maxD = maxDate.getDate();
  }
  const days = [];
  for (let d = minD; d <= maxD; d++) {
    days.push({ label: `${d}日`, value: d });
  }
  return days;
};

function CascadingDatePicker({ visible, onClose, value, onConfirm, min, max, title = '选择日期', embedded = false }) {
  const minDate = min || new Date();
  const maxDate = max || new Date(minDate.getFullYear() + 2, 11, 31);
  const initialDate = value || new Date();

  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth() + 1);
  const [day, setDay] = useState(initialDate.getDate());
  const latestValueRef = useRef([year, month, day]);

  // 当 value 或 visible 变化时同步（embedded 时用 visible 判断是否展示）
  useEffect(() => {
    if (visible !== false) {
      const d = value || new Date();
      setYear(d.getFullYear());
      setMonth(d.getMonth() + 1);
      setDay(d.getDate());
    }
  }, [visible, value]);

  const columns = useMemo(() => {
    const years = getYears(minDate, maxDate);
    const months = getMonths(year, minDate, maxDate);
    const days = getDays(year, month, minDate, maxDate);
    return [years, months, days];
  }, [year, month, minDate, maxDate]);

  const pickerValue = [year, month, day];
  latestValueRef.current = pickerValue;

  const handleConfirm = () => {
    const [y, m, d] = latestValueRef.current;
    const date = new Date(y, m - 1, d);
    onConfirm?.(date);
    onClose?.();
  };

  const handleChange = (val) => {
    let [y, m, d] = val;
    const maxDay = new Date(y, m, 0).getDate();
    if (d > maxDay) d = maxDay;
    setYear(y);
    setMonth(m);
    setDay(d);
  };

  const content = (
    <div className="cascading-date-picker">
      <div className="picker-header">
        <span className="picker-cancel" onClick={onClose}>取消</span>
        <span className="picker-title">{title}</span>
        <span className="picker-confirm" onClick={() => handleConfirm()}>确定</span>
      </div>
      <PickerView
        columns={columns}
        value={pickerValue}
        onChange={(val) => handleChange(val)}
        mouseWheel
        className="cascading-picker"
      />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position="bottom"
      bodyStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
    >
      {content}
    </Popup>
  );
}

export default CascadingDatePicker;
