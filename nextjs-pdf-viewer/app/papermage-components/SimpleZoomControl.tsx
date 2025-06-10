import { TransformContext, ZoomInButton, ZoomOutButton } from '@davidkric/pdf-components';
import * as React from 'react';

// A tiny zoom widget reused from PaperMage demo but adapted for @davidkric/pdf-components

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 0,
});

export const SimpleZoomControl: React.FC = () => {
  const { scale } = React.useContext(TransformContext);

  return (
    <span className="flex items-center space-x-1 select-none">
      <ZoomOutButton />
      <span className="text-xs font-mono w-10 text-center">{percentFormatter.format(scale)}</span>
      <ZoomInButton />
    </span>
  );
};

export default SimpleZoomControl; 