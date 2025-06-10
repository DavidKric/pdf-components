/* eslint-disable react/prop-types */
import { TextField } from '@mui/material';
import * as React from 'react';

import { codeStyle } from '../SingleLayer';

interface Props {
  value: number | '';
  disabled: boolean;
  setter: React.Dispatch<React.SetStateAction<number | undefined>>;
}

const setRange = (
  event: React.ChangeEvent<HTMLInputElement>,
  setter: React.Dispatch<React.SetStateAction<number | undefined>>
) => {
  const newValue = parseInt(event.target.value);
  if (isNaN(newValue)) {
    setter(undefined);
  } else {
    setter(newValue);
  }
  console.log(newValue, event);
};
const changeRange = (
  event: React.KeyboardEvent<HTMLInputElement>,
  setter: React.Dispatch<React.SetStateAction<number | undefined>>
) => {
  if (event.key === 'ArrowDown' || event.key === 'j') {
    event.preventDefault();
    setter(start => Math.max(0, (start ?? 0) - 1));
  } else if (event.key === 'ArrowUp' || event.key === 'k') {
    event.preventDefault();
    setter(start => (start ?? 0) + 1);
  }
};

export const NumberField: React.FunctionComponent<Props> = props => {
  const { value, setter, disabled } = props;
  return (
    <TextField
      value={value ?? ''}
      disabled={disabled}
      variant="standard"
      sx={{ m: 1, width: '3ch' }}
      size="small"
      style={codeStyle}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => setRange(event, setter)}
      onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => changeRange(event, setter)}
    />
  );
};
