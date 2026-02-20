import React, { useState, useMemo, useEffect } from 'react';
import { Cascader } from 'antd';

function generateDateOptions() {
  const options = [];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDay = new Date().getDate();

  for (let year = currentYear; year <= currentYear + 10; year++) {
    const yearOption = {
      value: year,
      label: `${year}年`,
      children: []
    };

    const startMonth = year === currentYear ? currentMonth : 1;
    for (let month = startMonth; month <= 12; month++) {
      const monthOption = {
        value: month,
        label: `${month}月`,
        children: []
      };

      const daysInMonth = new Date(year, month, 0).getDate();
      let startDay = 1;
      if (year === currentYear && month === currentMonth) {
        startDay = currentDay;
      }

      for (let day = startDay; day <= daysInMonth; day++) {
        monthOption.children.push({
          value: day,
          label: `${day}日`
        });
      }

      yearOption.children.push(monthOption);
    }

    options.push(yearOption);
  }

  return options;
}

function parseDateString(dateStr) {
  if (!dateStr) return undefined;
  const match = dateStr.match(/(\d+)年(\d+)月(\d+)日/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  return undefined;
}

function CascadingDatePicker({ value, onChange, placeholder = '请选择开业时间' }) {
  const [selectedValue, setSelectedValue] = useState(parseDateString(value));
  const options = useMemo(() => generateDateOptions(), []);

  useEffect(() => {
    setSelectedValue(parseDateString(value));
  }, [value]);

  const handleChange = (value) => {
    setSelectedValue(value);
    if (onChange && value && value.length === 3) {
      onChange(`${value[0]}年${value[1]}月${value[2]}日`);
    }
  };

  return (
    <Cascader
      options={options}
      value={selectedValue}
      onChange={handleChange}
      placeholder={placeholder}
      style={{ width: '100%' }}
      showSearch={false}
      expandTrigger="hover"
    />
  );
}

export default CascadingDatePicker;
