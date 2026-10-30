import './Skeleton.css';

/**
 * Reusable Skeleton loader for content-shaped loading states.
 */
export const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = '',
  style = {},
  count = 1,
}) => {
  const items = Array.from({ length: count });

  const getStyle = () => {
    const inlineStyle = { ...style };
    if (width) inlineStyle.width = width;
    if (height) inlineStyle.height = height;
    return inlineStyle;
  };

  return (
    <>
      {items.map((_, idx) => (
        <div
          key={idx}
          className={`skeleton skeleton--${variant} ${className}`}
          style={getStyle()}
          aria-hidden="true"
        />
      ))}
    </>
  );
};

export const JobCardSkeleton = () => (
  <div className="skeleton-job-card" aria-hidden="true">
    <div className="skeleton-job-card__header">
      <Skeleton variant="rounded" width="48px" height="48px" />
      <div className="skeleton-job-card__title-group">
        <Skeleton variant="text" width="65%" height="20px" />
        <Skeleton variant="text" width="40%" height="14px" />
      </div>
    </div>
    <div className="skeleton-job-card__meta">
      <Skeleton variant="rounded" width="80px" height="24px" />
      <Skeleton variant="rounded" width="90px" height="24px" />
      <Skeleton variant="rounded" width="70px" height="24px" />
    </div>
    <div className="skeleton-job-card__footer">
      <Skeleton variant="text" width="30%" height="16px" />
      <Skeleton variant="rounded" width="100px" height="34px" />
    </div>
  </div>
);

export const MetricCardSkeleton = () => (
  <div className="skeleton-metric-card" aria-hidden="true">
    <div className="skeleton-metric-card__top">
      <Skeleton variant="text" width="50%" height="14px" />
      <Skeleton variant="circle" width="36px" height="36px" />
    </div>
    <Skeleton variant="text" width="40%" height="32px" className="my-2" />
    <Skeleton variant="text" width="70%" height="12px" />
  </div>
);

export default Skeleton;
