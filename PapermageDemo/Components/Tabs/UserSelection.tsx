/* eslint-disable react/prop-types */
import { Dimensions, DocumentContext, TransformContext } from '@allenai/pdf-components';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import * as React from 'react';
import { useContext, useEffect, useState } from 'react';

import { codeStyle, CoordType, TabProps } from './SingleLayer';

const fetchHighlights = async (
  corpusId: string,
  type: string,
  userSelectionBlock: CoordType,
  pageDimensions: Dimensions,
  scale: number
) => {
  const MAX = 1000;
  const fx = pageDimensions.width * scale;
  const fy = pageDimensions.height * scale;
  const left = userSelectionBlock.left / fx;
  const top = userSelectionBlock.top / fy;
  const width = userSelectionBlock.width / fx;
  const height = userSelectionBlock.height / fy;
  const url = `/api/annotations/${corpusId}/${type}/${left}/${top}/${width}/${height}/${userSelectionBlock.page}`;
  console.log('url', url);
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

export const UserSelectionTab: React.FunctionComponent<
  TabProps & { userSelectionBlock?: CoordType }
> = props => {
  const {
    slice,
    loading,
    supportedLayers,
    corpusId,
    setLoading,
    setHighlights,
    setAnnotations,
    userSelectionBlock,
  } = props;
  const { pageDimensions } = useContext(DocumentContext);
  const { scale } = useContext(TransformContext);
  const [type, setType] = useState<string>('');
  const handleSelectChange = (event: SelectChangeEvent) => {
    setType(event.target.value as string);
  };

  useEffect(() => {
    setStart(undefined);
    setEnd(undefined);
  }, [type]);

  useEffect(() => {
    if (!supportedLayers || supportedLayers.length === 0) return;
    if (supportedLayers.includes('tokens')) {
      setType('tokens');
    } else {
      setType(supportedLayers[0]);
    }
  }, [supportedLayers]);

  useEffect(() => {
    if (
      !corpusId ||
      !type ||
      !pageDimensions ||
      pageDimensions.width === 0 ||
      !userSelectionBlock
    ) {
      return;
    }
    setLoading(true);
    setHighlights([]);
    fetchHighlights(corpusId, type, userSelectionBlock, pageDimensions, scale)
      .then(({ highlights, annotations }) => {
        setHighlights(highlights);
        setAnnotations(annotations);
        console.log('highlights', highlights);
      })
      .finally(() => setLoading(false));
  }, [type, corpusId, pageDimensions, userSelectionBlock]);

  const [start, setStart] = useState<number | undefined>(undefined);
  const [end, setEnd] = useState<number | undefined>(undefined);

  useEffect(() => {
    slice(start, end);
  }, [start, end, slice]);
  return (
    <div>
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
      </div>
      <div style={{ margin: '12px 0' }}>Use your cursor to select a region on the PDF.</div>
    </div>
  );
};
