import type { DayPoint } from '@/lib/analyticsQueries';

/**
 * График посещаемости по дням.
 *
 * Нарисован SVG вручную: внешняя библиотека графиков здесь весила бы
 * больше, чем весь остальной код админки, и тянула бы зависимость
 * ради одной диаграммы.
 */
export function TrafficChart({ data }: { data: DayPoint[] }) {
  if (data.length === 0) {
    return <p className="text-body text-inkMuted">Данных за период нет.</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.views));
  const width = 100;
  const height = 32;
  const gap = data.length > 60 ? 0.2 : data.length > 30 ? 0.4 : 0.8;
  const barWidth = Math.max(0.4, width / data.length - gap);

  const formatDate = (iso: string) => {
    const [, month, day] = iso.split('-');
    return `${day}.${month}`;
  };

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Просмотры по дням, максимум ${max} за день`}
        className="h-40 w-full"
      >
        {/* Горизонтальные направляющие вместо сетки-клетки */}
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1="0"
            x2={width}
            y1={height * fraction}
            y2={height * fraction}
            stroke="#DCD3C7"
            strokeWidth="0.15"
          />
        ))}

        {data.map((point, index) => {
          const barHeight = (point.views / max) * (height - 1);
          return (
            <rect
              key={point.date}
              x={index * (width / data.length)}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              fill="#B4763A"
            >
              <title>
                {formatDate(point.date)}: {point.views} просмотров, {point.visitors} посетителей
              </title>
            </rect>
          );
        })}
      </svg>

      <figcaption className="mt-3 flex justify-between font-sans text-badge uppercase tabularNums text-inkMuted">
        <span>{formatDate(data[0].date)}</span>
        <span>максимум за день: {max}</span>
        <span>{formatDate(data[data.length - 1].date)}</span>
      </figcaption>
    </figure>
  );
}
