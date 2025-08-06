import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';

const CustomPopover = ({
  className,
  trigger,
  children,
  open,
  onOpenChange,
  align,
}) => (
  <Popover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger>{trigger}</PopoverTrigger>
    <PopoverContent align={align} className={className}>
      {children}
    </PopoverContent>
  </Popover>
);
export default CustomPopover;
