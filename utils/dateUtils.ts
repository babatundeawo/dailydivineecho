
export const getDayOfYearInfo = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const start = new Date(year, 0, 0);
  const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  
  const isLeap = (y: number) => {
    return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  };
  
  const totalDays = isLeap(year) ? 366 : 365;
  
  return {
    current: day,
    total: totalDays,
    formatted: `${day}/${totalDays}`,
    dateString: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
    fullDateString: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  };
};
