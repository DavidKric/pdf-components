/* eslint-disable react/prop-types */
import * as React from 'react';
import { FC } from 'react';

interface Props {
  style?: React.CSSProperties;
}

const S2Logo: FC<Props> = props => {
  const { style = {} } = props;

  return (
    <svg
      style={{ position: 'relative', top: '1px', ...style }}
      viewBox="0 0 139 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_2791_6895)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M138.667 30.5C133.833 33.5 130.333 35.3333 126.333 37.6667C102.333 52.1667 79.1666 68.3333 61.3333 89.5L52.6666 100L26.3333 58C32.1666 62.6667 47 75.8333 53 78.8333L72.3333 64.1667C85.8333 54.6667 124 34 138.667 30.5Z"
          fill="white"
        />
        <path
          d="M38.6667 61.8333C39.3333 62.3333 39.8333 62.8333 40.5 63.3333C35.3333 48.8333 26.1667 34.3333 13.1667 21.8333C8.83333 21.8333 4.5 21.8333 0 21.8333C16.6667 33.8333 29.6667 47.8333 38.6667 61.8333Z"
          fill="white"
        />
        <path
          d="M43 65.6667C43.5 66.1667 44.1667 66.5 44.6667 67C43.8333 47.3334 36.5 27.1667 22.5 9.83337C18.3333 9.83337 14.1667 9.83337 10 9.83337C27.8333 26.3334 38.8333 46.3334 43 65.6667Z"
          fill="white"
        />
        <path
          d="M46.5 68.5C48.5 70.1667 50.5 71.6667 52.1667 72.8333C56.5 51.6667 52.8333 28.8333 41.3333 9C60.8333 8.66667 80.3333 8.5 99.6667 8.16667C104 17.8333 106.5 28.1667 107.167 38.8333C108.833 38 110.5 37.1667 112.333 36.3333C111.5 25.3333 108.5 13.6667 102.667 0C76 0 49.5 0 22.8333 0C40.1667 20.5 48 45.3333 46.5 68.5Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0_2791_6895">
          <rect width="138.667" height="100" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default S2Logo;
