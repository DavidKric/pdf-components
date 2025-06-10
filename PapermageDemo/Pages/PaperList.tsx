import { Header, VarnishApp } from '@allenai/varnish2/components';
import { MaxWidthText } from '@allenai/varnish2/components';
import { pxToRem } from '@allenai/varnish2/utils/base';
import { Grid, Paper } from '@mui/material';
import * as React from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import S2Logo from '../components/S2Logo';

const PaperList: React.FC = () => {
  const [papers, setPapers] = React.useState<{ [id: string]: string }>({});
  useEffect(() => {
    const url = '/api/thumbnails';
    fetch(url)
      .then(response => response.json())
      .then(data => setPapers(data));
  }, []);

  return (
    <VarnishApp>
      <Header
        bannerAlwaysVisible
        customBanner={
          <Link to="/">
            <Header.AI2Banner>
              <Tagline.Container>
                <S2Logo style={{ height: '20px', padding: '6px 0', boxSizing: 'content-box' }} />
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
      <div
        style={{
          paddingTop: '40px',
          paddingBottom: '20px',
          display: 'flex',
          justifyContent: 'center',
        }}>
        <MaxWidthText style={{ maxWidth: '90ch' }}>
          <h4>
            PaperMage: A Unified Toolkit for Processing, Representing, and Manipulating
            Visually-Rich Scientific Documents
          </h4>
          <p>
            Kyle Lo, Zejiang Shen, Benjamin Newman, Joseph Chee Chang, Russell Authur, Erin Bransom,
            Stefan Candra, Yoganand Chandrasekhar, Regan Huff, Bailey Kuehl, Amanpreet Singh, Chris
            Wilhelm, Angele Zamarron, Marti A. Hearst, Daniel S. Weld, Doug Downey, Luca Soldaini.
          </p>
          <p style={{ color: 'gray' }}>Click on a paper below to see a live demo of PaperMage.</p>
          <Grid container spacing={3}>
            {Object.keys(papers).map(id => {
              return (
                <Grid item xs={4} key={id}>
                  <a href={`/reader/${id}`} target="_self">
                    <Paper elevation={4} square>
                      <img src={papers[id]} alt={`${id} paper`} style={{ width: '100%' }} />
                    </Paper>
                  </a>
                </Grid>
              );
            })}
          </Grid>
          <p style={{ paddingTop: '12px' }}>
            Despite growing interest in applying natural language processing (NLP) and computer
            vision (CV) models to the scholarly domain, scientific documents remain challenging to
            work with. They are often in difficult-to-use PDF formats, and the ecosystem of models
            to process them is fragmented and incomplete. We introduce PaperMage, an open-source
            Python toolkit for analyzing and processing visually-rich, structured scientific
            documents. PaperMage offers clean and intuitive abstractions for seamlessly representing
            and manipulating both textual and visual document elements. PaperMage achieves this by
            integrating disparate state-of-the-art NLP and CV models into a unified framework, and
            provides turn-key recipes for common scientific document processing use-cases. PaperMage
            has powered multiple research prototypes of AI applications over scientific documents,
            along with Semantic Scholar{"'"}s large-scale production system for processing millions
            of PDFs.
          </p>
          <p>
            Read more about the broader{' '}
            <a href="https://openreader.semanticscholar.org/" target="_blank" rel="noreferrer">
              Semantic Reader Open Research Platform
            </a>
            .
          </p>
        </MaxWidthText>
      </div>
    </VarnishApp>
  );
};

export default PaperList;

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
