'use client';

import { GripVertical } from 'lucide-react';
import * as ResizablePrimitive from 'react-resizable-panels';

import { cn } from '@/lib/utils';

type PanelGroupProps = React.ComponentProps<typeof ResizablePrimitive.Group> & {
  /** @deprecated Use `orientation` from react-resizable-panels v4. */
  direction?: 'horizontal' | 'vertical';
};

const ResizablePanelGroup = ({
  className,
  direction,
  orientation,
  ...props
}: PanelGroupProps) => (
  <ResizablePrimitive.Group
    orientation={
      orientation ?? (direction === 'vertical' ? 'vertical' : 'horizontal')
    }
    className={cn('h-full w-full', className)}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.Separator
    className={cn(
      'relative flex w-px shrink-0 items-center justify-center bg-border',
      'after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1',
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
