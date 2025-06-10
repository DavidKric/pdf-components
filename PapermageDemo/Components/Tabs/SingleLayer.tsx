/* eslint-disable react/prop-types */
import { Dimensions, DocumentContext } from '@allenai/pdf-components';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import * as React from 'react';
import { useContext, useEffect, useState } from 'react';

import { NumberField } from './widgets/NumberField';

export interface CoordType {
  page: number;
  top: number;
  left: number;
  height: number;
  width: number;
  gid: number;
}

export const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontWeight: 'bold',
  color: 'black',
};

const fetchHighlights = async (corpusId: string, type: string, pageDimensions: Dimensions) => {
  const MAX = 1000;
  const url = `/api/annotations/${corpusId}/${type}`;
  const response = await fetch(url);
  const annotations = (await response.json()).slice(0, MAX) as { boxes: number[][] }[];
  const highlights: CoordType[][] = [];
  annotations.forEach((annotation, idx) => {
    highlights.push(
      annotation.boxes.map((bbox: number[]) => ({
        left: bbox[0] * pageDimensions.width,
        top: bbox[1] * pageDimensions.height,
        width: bbox[2] * pageDimensions.width,
        height: bbox[3] * pageDimensions.height,
        page: bbox[4],
        gid: idx,
      }))
    );
  });
  return { highlights, annotations };
};
export interface TabProps {
  slice: (start: number | undefined, end: number | undefined) => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  corpusId: string;
  supportedLayers: string[];
  setHighlights: React.Dispatch<React.SetStateAction<CoordType[][]>>;
  setAnnotations: React.Dispatch<React.SetStateAction<{ boxes: number[][] }[]>>;
}

export const SingleLayerTab: React.FunctionComponent<TabProps> = props => {
  const { slice, loading, supportedLayers, corpusId, setLoading, setHighlights, setAnnotations } =
    props;
  const { pageDimensions } = useContext(DocumentContext);
  const [type, setType] = useState<string>('');
  const handleSelectChange = (event: SelectChangeEvent) => {
    setType(event.target.value as string);
  };

  useEffect(() => {
    if (!supportedLayers || supportedLayers.length === 0) return;
    if (supportedLayers.includes('rows')) {
      setType('rows');
    } else {
      setType(supportedLayers[0]);
    }
  }, [supportedLayers]);

  useEffect(() => {
    setStart(undefined);
    setEnd(undefined);
  }, [type]);

  useEffect(() => {
    if (!corpusId || !type || !pageDimensions || pageDimensions.width === 0) {
      return;
    }
    console.log('fetching');
    setLoading(true);
    setHighlights([]);
    fetchHighlights(corpusId, type, pageDimensions)
      .then(({ highlights, annotations }) => {
        setHighlights(highlights);
        setAnnotations(annotations);
        console.log('highlights', highlights);
      })
      .finally(() => setLoading(false));
  }, [type, corpusId, pageDimensions]);

  const [start, setStart] = useState<number | undefined>(undefined);
  const [end, setEnd] = useState<number | undefined>(undefined);

  useEffect(() => {
    console.log('slicing');
    slice(start, end);
  }, [start, end, slice]);

  return (
    <div
      style={{
        ...codeStyle,
        fontSize: '1.2em',
        display: 'flex',
        alignItems: 'baseline',
      }}>
      <span>document.</span>
      <FormControl variant="standard" sx={{ m: 1 }} size="small">
        <Select
          value={type}
          label="Type"
          onChange={handleSelectChange}
          style={codeStyle}
          disabled={loading}>
          {supportedLayers.map(layer => (
            <MenuItem value={layer} key={layer}>
              {layer}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <span>[</span>
      <NumberField disabled={loading} value={start ?? ''} setter={setStart} />
      <span>:</span>
      <NumberField disabled={loading} value={end ?? ''} setter={setEnd} />
      <span>]</span>
    </div>
  );
};
