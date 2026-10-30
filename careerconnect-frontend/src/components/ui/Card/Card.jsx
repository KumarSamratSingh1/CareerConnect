import { cn } from '../../../utils/cn';
import './Card.css';

/**
 * Reusable Card component with compound Header, Title, Description, Body, Footer.
 */
export const Card = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  return (
    <div className={cn('card', `card--${variant}`, className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={cn('card-header', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={cn('card-title', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={cn('card-description', className)} {...props}>
    {children}
  </p>
);

export const CardBody = ({ children, noPadding = false, className = '', ...props }) => (
  <div className={cn('card-body', noPadding && 'card-body--no-padding', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={cn('card-footer', className)} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
