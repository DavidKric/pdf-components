/* eslint-disable react/prop-types */
import { Dimensions, DocumentContext } from '@allenai/pdf-components';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import * as React from 'react';
import { useContext, useEffect, useState } from 'react';

import { codeStyle, CoordType, TabProps } from './SingleLayer';
import { NumberField } from './widgets/NumberField';

const fetchHighlights = async (
  corpusId: string,
  type0: string,
  start: number | undefined,
  end: number | undefined,
  type1: string,
  pageDimensions: Dimensions
) => {
  const MAX = 1000;
  const url = `/api/annotations/${corpusId}/${type0}/${start}/${end}/${type1}`;
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

export const CrossLayerTab: React.FunctionComponent<TabProps> = props => {
  const { slice, loading, supportedLayers, corpusId, setLoading, setHighlights, setAnnotations } =
    props;
  const { pageDimensions } = useContext(DocumentContext);
  const [type0, setType0] = useState<string>('');
  const [type1, setType1] = useState<string>('');
  const handleSelectChange0 = (event: SelectChangeEvent) => {
    setType0(event.target.value as string);
  };
  const handleSelectChange1 = (event: SelectChangeEvent) => {
    setType1(event.target.value as string);
  };
  useEffect(() => {
    setStart0(0);
    setEnd0(1);
    setStart(undefined);
    setEnd(undefined);
  }, [type0]);
  useEffect(() => {
    setStart(undefined);
    setEnd(undefined);
  }, [type1]);

  useEffect(() => {
    if (!supportedLayers || supportedLayers.length < 2) return;
    if (supportedLayers.includes('tokens') && supportedLayers.includes('abstracts')) {
      setType0('abstracts');
      setType1('tokens');
    } else {
      setType0(supportedLayers[0]);
      setType1(supportedLayers[1]);
    }
  }, [supportedLayers]);

  const [start0, setStart0] = useState<number | undefined>(undefined);
  const [end0, setEnd0] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!corpusId || !type0 || !type1 || !pageDimensions || pageDimensions.width === 0) {
      return;
    }
    setLoading(true);
    setHighlights([]);
    fetchHighlights(corpusId, type0, start0, end0, type1, pageDimensions)
      .then(({ highlights, annotations }) => {
        setHighlights(highlights);
        setAnnotations(annotations);
        console.log('highlights', highlights);
      })
      .finally(() => setLoading(false));
  }, [type0, type1, start0, end0, corpusId, pageDimensions]);

  const [start, setStart] = useState<number | undefined>(undefined);
  const [end, setEnd] = useState<number | undefined>(undefined);

  useEffect(() => {
    slice(start, end);
  }, [start, end, slice]);

  return (
    <div
      style={{
        ...codeStyle,
        fontSize: '1.2em',
      }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
        }}>
        <span>document.</span>
        <FormControl variant="standard" sx={{ m: 1 }} size="small">
          <Select
            value={type0}
            label="Type"
            onChange={handleSelectChange0}
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
        <NumberField disabled={loading} value={start0 ?? ''} setter={setStart0} />
        <span>:</span>
        <NumberField disabled={loading} value={end0 ?? ''} setter={setEnd0} />
        <span>]</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
        }}>
        <span style={{ visibility: 'hidden' }}>document.</span>
        <FormControl variant="standard" sx={{ m: 1 }} size="small">
          <Select
            value={type1}
            label="Type"
            onChange={handleSelectChange1}
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
    </div>
  );
};
