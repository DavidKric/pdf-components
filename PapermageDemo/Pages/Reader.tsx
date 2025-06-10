import {
    DocumentContext,
    DocumentWrapper,
    Overlay,
    PageWrapper,
    ScrollContext,
    scrollToId,
    TransformContext,
  } from '@allenai/pdf-components';
  import { Header, VarnishApp } from '@allenai/varnish2/components';
  import { pxToRem } from '@allenai/varnish2/utils/base';
  import Tab from '@mui/material/Tab';
  import Tabs from '@mui/material/Tabs';
  import * as React from 'react';
  import { useCallback, useContext, useEffect, useState } from 'react';
  import { RouteComponentProps } from 'react-router';
  import { Link, useLocation, useParams } from 'react-router-dom';
  import styled from 'styled-components';
  
  import { AuthorDragOverlay } from '../components/AuthorDragOverlay';
  import S2Logo from '../components/S2Logo';
  import { SimpleZoomControl } from '../components/SimpleZoomControl';
  import { CrossLayerTab } from '../components/Tabs/CrossLayer';
  import { SingleLayerTab } from '../components/Tabs/SingleLayer';
  import { UserSelectionTab } from '../components/Tabs/UserSelection';
  import { TextHighlightGroup } from '../components/TextHighlightGroup';
  import { Thumbnail } from '../components/Thumbnail';
  import { DemoHeaderContextProvider } from '../logic/DemoHeaderContext';
  import { Annotations } from '../types/annotations';
  
  const Tagline = {
    Container: styled.span`
      display: flex;
      align-items: center;
      gap: 1ch;
    `,
    Text1: styled.span`
      color: ${({ theme }) => theme.color2.N1.toString()};
      font-weight: 'bold';
      font-size: ${pxToRem(16)};
    `,
    Text2: styled.em`
      color: ${({ theme }) => theme.color2.N1.toString()};
      font-size: ${pxToRem(16)};
    `,
  };
  
  const ClickablePre = styled.pre<{ $hovered: boolean }>`
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
    box-sizing: border-box;
    border: 2px solid ${props => (props.$hovered ? 'red' : 'black')};
    scroll-margin-top: 12px;
    scroll-padding-top: 12px;
    &:hover {
      cursor: pointer;
      border: 2px solid red;
    }
  `;
  
  interface GETParams {
    zoom?: string;
    tid?: string;
    userId?: string;
  }
  
  function useZoom() {
    const { search } = useLocation<GETParams>();
    return React.useMemo(() => {
      const query = new URLSearchParams(search);
      return parseFloat(query.get('zoom') ?? '1');
    }, [search]);
  }
  
  export interface CoordType {
    page: number;
    top: number;
    left: number;
    height: number;
    width: number;
    gid: number;
  }
  
  const fetchSupportedLayers = async () => {
    const url = `/api/layers`;
    const response = await fetch(url);
    const layers = (await response.json()) as string[];
    return layers;
  };
  
  export const Reader: React.FunctionComponent<RouteComponentProps> = () => {
    const { corpusId } = useParams<{ corpusId: string }>();
    const { numPages } = useContext(DocumentContext);
    const [supportedLayers, setSupportedLayers] = useState<string[]>([]);
    const [hoveredIdx, setHoveredIdx] = useState<number | undefined>(undefined);
    const { setScale } = useContext(TransformContext);
    const [userSelectionBlock, setUserSelectionBlock] = useState<CoordType | undefined>(undefined);
    const zoom = useZoom();
    useEffect(() => {
      setScale(zoom);
    }, [zoom]);
    useEffect(() => {
      setLoading(true);
      fetchSupportedLayers()
        .then(layers => {
          setSupportedLayers(layers);
        })
        .finally(() => setLoading(false));
    }, []);
  
    const { setScrollRoot } = React.useContext(ScrollContext);
    new Map<number, Annotations>();
    const pdfContentRef = React.createRef<HTMLDivElement>();
    const pdfScrollableRef = React.createRef<HTMLDivElement>();
  
    const [loading, setLoading] = useState<boolean>(false);
  
    const [highlights, setHighlights] = useState<CoordType[][]>([]);
    const [slicedHighlights, setSlicedHighlights] = useState<CoordType[][]>([]);
    const [annotations, setAnnotations] = useState<any[]>([]);
    const [slicedAnnotations, setSlicedAnnotations] = useState<any[]>([]);
    const slice = useCallback(
      (start: number | undefined, end: number | undefined) => {
        setSlicedHighlights(highlights.slice(start ?? 0, end ?? highlights.length));
        setSlicedAnnotations(annotations.slice(start ?? 0, end ?? annotations.length));
      },
      [highlights, annotations]
    );
  
    const [tab, setTab] = useState(0);
  
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setTab(newValue);
    };
  
    const pdfUrl = `/api/pdf/${corpusId}`;
  
    React.useEffect(() => {
      setScrollRoot(null);
    }, []);
  
    const createBlock = (block: CoordType) => {
      console.log(block);
      setUserSelectionBlock(block);
    };
  
    return (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
        }}>
        <div
          style={{
            zIndex: 1,
            boxShadow: '0px -10px 20px 10px darkgray',
            flex: '0 0 450px',
            width: '450px',
            maxWidth: '450px',
            position: 'relative',
          }}>
          <VarnishApp>
            <div style={{ fontSize: '0.9em', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '100%' }}>
                <Header
                  bannerAlwaysVisible
                  customBanner={
                    <Link to="/">
                      <Header.AI2Banner>
                        <Tagline.Container>
                          <S2Logo
                            style={{ height: '20px', padding: '6px 0', boxSizing: 'content-box' }}
                          />
                          <Tagline.Text1>
                            <span>The PaperMage Project</span>
                          </Tagline.Text1>
                          <Tagline.Text2>
                            <span>Demo</span>
                          </Tagline.Text2>
                        </Tagline.Container>
                      </Header.AI2Banner>
                    </Link>
                  }></Header>
              </div>
              <div
                style={{
                  flexGrow: 1,
                  overflowX: 'hidden',
                  overflowY: 'auto',
                  maxHeight: 'calc(100vh - 40px)',
                  height: 'calc(100vh - 40px)',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                <div>
                  <Tabs
                    variant="fullWidth"
                    value={tab}
                    onChange={handleTabChange}
                    style={{ padding: 0 }}>
                    <Tab label="Single Layer" />
                    <Tab label="Cross Layers" />
                    <Tab label="User Selection" />
                  </Tabs>
                </div>
                <div style={{ padding: '12px' }}>
                  {tab === 0 && (
                    <SingleLayerTab
                      slice={slice}
                      supportedLayers={supportedLayers}
                      loading={loading}
                      setLoading={setLoading}
                      setHighlights={setHighlights}
                      setAnnotations={setAnnotations}
                      corpusId={corpusId}
                    />
                  )}
                  {tab === 1 && (
                    <CrossLayerTab
                      slice={slice}
                      supportedLayers={supportedLayers}
                      loading={loading}
                      setLoading={setLoading}
                      setHighlights={setHighlights}
                      setAnnotations={setAnnotations}
                      corpusId={corpusId}
                    />
                  )}
                  {tab === 2 && (
                    <UserSelectionTab
                      slice={slice}
                      supportedLayers={supportedLayers}
                      loading={loading}
                      setLoading={setLoading}
                      setHighlights={setHighlights}
                      setAnnotations={setAnnotations}
                      corpusId={corpusId}
                      userSelectionBlock={userSelectionBlock}
                    />
                  )}
                </div>
                <div
                  style={{
                    background: 'black',
                    color: 'white',
                    fontSize: '12px',
                    flexGrow: 1,
                    padding: '12px',
                    boxSizing: 'border-box',
                    margin: 0,
                    overflow: 'scroll',
                  }}>
                  {loading && (
                    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>Loading...</pre>
                  )}
                  {!loading && (
                    <>
                      <pre style={{ margin: '0 0 0 -10px' }}>{'['}</pre>
                      {slicedAnnotations.map((annotation, idx) => (
                        <ClickablePre
                          id={`scrollToJson_${idx}`}
                          key={idx}
                          $hovered={hoveredIdx === idx}
                          onMouseOver={() => setHoveredIdx(idx)}
                          onMouseOut={() => setHoveredIdx(undefined)}
                          onClick={() => scrollToId(`scrollToBox_${idx}`)}>
                          {JSON.stringify(
                            annotation,
                            function (k, v) {
                              if (v instanceof Array) return JSON.stringify(v);
                              return v;
                            },
                            2
                          )}
                          ,
                        </ClickablePre>
                      ))}
                      <pre style={{ margin: '0 0 0 -10px' }}>{']'}</pre>
                    </>
                  )}
                </div>
              </div>
            </div>
          </VarnishApp>
        </div>
        <div
          className="reader__container"
          style={{ flexGrow: 1, maxHeight: '100vh', overflow: 'scroll' }}>
          <div style={{ position: 'fixed', top: '4px', right: '18px', zIndex: 100 }}>
            <SimpleZoomControl />
          </div>
          <DemoHeaderContextProvider>
            <DocumentWrapper className="reader__main" file={pdfUrl} inputRef={pdfContentRef}>
              <Thumbnail parentRef={pdfContentRef} />
              <div className="reader__page-list" ref={pdfScrollableRef}>
                {Array.from({ length: numPages }).map((_, i) => (
                  <PageWrapper key={`${i}`} pageIndex={i}>
                    <Overlay>
                      <TextHighlightGroup
                        pageIndex={i}
                        highlightGroups={slicedHighlights}
                        hoveredIdx={hoveredIdx}
                        setHoveredIdx={setHoveredIdx}
                      />
                      {tab === 2 ? (
                        <AuthorDragOverlay pageIndex={i} altDown={true} createBlock={createBlock} />
                      ) : (
                        <></>
                      )}
                    </Overlay>
                  </PageWrapper>
                ))}
              </div>
            </DocumentWrapper>
          </DemoHeaderContextProvider>
        </div>
      </div>
    );
  };
  