// TODO: Add metrics like timeDisplayed, numberOfTimesShown, distinctions between types of ads (in-chat v. flash v. loading substitute)

'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, IconButton, Container, TextField, Button, Typography, Paper, List, Box, AppBar, Toolbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/system';
import adverstisementsJson from '../app/db.json';
import Image from 'next/image';

interface HistoryItem {
  role: string;
  content: string;
}

const StyledPaper = styled(Paper)({
  padding: '1rem',
  marginTop: '1rem',
  marginBottom: '1rem',
  fontFamily: 'Open Sans, sans-serif',
});

const StyledButton = styled(Button)({
  height: '56px', // to match TextField height
});

const FixedAppBar = styled(AppBar)({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1100,
});

const parseCompanies = () => {
  const companyMap = new Map<string, string>();
  
  adverstisementsJson.Advertisements.forEach(company => {
    company.Categories.forEach(category => {
      companyMap.set(category, company.ImageUrl);
    });
  });

  return companyMap;
}

const getRandomAd = (map: Map<String, String>): string => {
  const keysArray = Array.from(map.keys());
  const randomIndex = Math.floor(Math.random() * keysArray.length);
  return keysArray[randomIndex].valueOf();
}

const parseDescriptions = (): Map<string, string> => {
  const descriptionsMap = new Map<string, string>();
  adverstisementsJson.Advertisements.forEach(company => {
    company.Categories.forEach(category => {
      descriptionsMap.set(category, company.Description);
    });
  });

  return descriptionsMap;
}

export default function Home() {
  const companies = parseCompanies();
  const categories = Array.from(companies.keys());
  const drugDescriptions = parseDescriptions();

  const [question, setQuestion] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [answer, setAnswer] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Ad related state variables
  const [advertisement, setAdvertisement] = useState<string>('');
  const [advertisementText, setAdvertisementText] = useState<string>('');
  const [advertisementVisible, setAdvertisementVisible] = useState<boolean>(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number>(0);
  const [advertisementReady, setAdvertisementReady] = useState<boolean>(false);
  const [submissionCount, setSubmissionCount] = useState<number>(0);

  const MINIMUM_DISPLAY_TIME = 10000; // 10 seconds
  const AD_FREQUENCY = 1;

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleLoadingWithDelay = () => {
    const currentTime = Date.now();
    const timeElapsed = currentTime - loadingStartTime;
    
    if (timeElapsed >= MINIMUM_DISPLAY_TIME) {
      // Close pop-up if enough time has passed
      setLoading(false);
      setAdvertisementVisible(false);
      setAdvertisementReady(false);
    } else {
      // Close pop-up after minimum time has elapsed
      const remainingTime = MINIMUM_DISPLAY_TIME - timeElapsed;
      setTimeout(() => {
        setLoading(false);
        setAdvertisementVisible(false);
        setAdvertisementReady(false);
      }, remainingTime);
    }
    scrollToBottom();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setSubmissionCount((prevCount) => prevCount + 1);

    scrollToBottom();

    try {
      const response = await axios.post('/api/ask', { question, history });
      const newHistory = [...history, { role: 'user', content: question }, { role: 'assistant', content: response.data.answer }];
      setHistory(newHistory);
      setAnswer(response.data.answer);
      setQuestion('');
    } catch (error) {
      console.error('Error fetching the answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setHistory([]);
    setAnswer('');
    setQuestion('');
    setAdvertisement('');
    setAdvertisementText('');
    setAdvertisementVisible(false);
    setLoadingStartTime(0);
    setAdvertisementReady(false);
    // Do not change submission count

    scrollToBottom();
  };

  const handleCloseModal = () => {
    setAdvertisementVisible(false);
    setAdvertisementReady(false);
  };

  const fetchAd = async () => {
    try {
      const response = await axios.post('/api/categorizeNew', { question, categories });
      const adResponse = response.data.category;
      if (adResponse == "random") {
        return getRandomAd(companies);
      }
      return adResponse;
    } catch (error) {
      return getRandomAd(companies);
    }
  }

  useEffect(() => {
    if (loading && submissionCount % AD_FREQUENCY === 0) {
      // Show pop-up box but not ad until it is fetched
      setLoadingStartTime(Date.now());
      setAdvertisementVisible(true);
      setAdvertisementReady(false);
    } else if (!loading) {
      handleLoadingWithDelay();
    }
  }, [loading]);

  useEffect(() => {
    if (loading && submissionCount % AD_FREQUENCY === 0) {
      const fetchAdvertisement = async () => {
        const ad = await fetchAd();
        setAdvertisement(ad);
        setAdvertisementReady(true);
      };

      fetchAdvertisement();
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [loading, history]);

  useEffect(() => {
    if (advertisement) {
      setAdvertisementText(`You may be interested in ${drugDescriptions.get(advertisement)}`);
    }
  }, [advertisement]);

  return (
    <>
      <FixedAppBar position="static">
        <Container maxWidth="md">
          <Toolbar disableGutters>
            <Typography variant="h6" style={{ flexGrow: 1, fontFamily: 'Roboto, sans-serif' }}>
              Simple Ask
            </Typography>
            <Button color="inherit" onClick={handleNewConversation}>New Conversation</Button>
          </Toolbar>
        </Container>
      </FixedAppBar>
      <Container maxWidth="md" style={{ marginTop: '120px', fontFamily: 'Roboto, sans-serif', marginBottom: '250px' }}>
        {history.length > 0 && (
          <List>
            {history.map((item, index) => (
              <StyledPaper elevation={3} key={index}>
                <Typography variant="body1" component="div">
                  <strong>{item.role.charAt(0).toUpperCase() + item.role.slice(1)}:</strong>
                </Typography>
                <Box component="div" dangerouslySetInnerHTML={{ __html: item.content.replace(/\n/g, '<br />') }} />
              </StyledPaper>
            ))}
          </List>
        )}
        <StyledPaper elevation={3}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <TextField
              label="Ask a question"
              variant="outlined"
              fullWidth
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}  // Disable input while loading
            />
            <StyledButton type="submit" variant="contained" color="primary" disabled={loading}>
              Ask
            </StyledButton>
          </form>
        </StyledPaper>
        {advertisementText && (
          <StyledPaper elevation={3} style={{ marginTop: '1rem', backgroundColor: '#FFFDD0' }}>
            <Typography variant="body1" component="div" color="#D27D2D">
              <strong>Sponsored Message:</strong>
            </Typography>
            <Box component="div" dangerouslySetInnerHTML={{ __html: advertisementText.replace(/\n/g, '<br />') }} />
          </StyledPaper>
        )}
      </Container>
      <Modal
        open={advertisementVisible}
        onClose={() => {}}
        aria-labelledby="loading-ad-modal"
        aria-describedby="loading-advertisement-popup"
        closeAfterTransition
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: 1000,
            height: 250,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: '8px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {!loading && (
            <IconButton
              onClick={handleCloseModal}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1300, // Ensure it is above the advertisement content
              }}
            >
              Skip Ad <CloseIcon />
            </IconButton>
          )}
          <Typography variant="h6" color="textPrimary" mb={2}>
            Advertisement
          </Typography>
          {advertisementReady ? (
            <Image
              src={`/assets/advertisements/${companies.get(advertisement)}`}
              width={1000}
              height={200}
              alt={"advertisements/" + advertisement}
            />
          ) : (
            <Typography variant="body2" color="textSecondary">
              Loading advertisement...
            </Typography>
          )}
          {loading && (
          <Typography variant="body2" color="textSecondary" mt={2}>
            Loading response, please wait...
          </Typography>
          )}
        </Box>
      </Modal>
    </>
  );
}
