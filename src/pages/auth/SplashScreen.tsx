import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const SplashContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #004953 0%, #006064 50%, #00363a 100%);
  animation: fadeIn 1.5s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const SplashLogo = styled.img`
  width: 180px;
  height: auto;
  margin-bottom: 30px;
`;

const SplashTitle = styled.h1`
  font-size: 42px;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
  margin-top: 20px;
  font-family: 'Roboto', sans-serif;
`;

const GetStartedButton = styled.button`
  background-color: #00C389;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  max-width: 300px;
  margin-top: 40px;
  transition: background-color 0.3s;
  text-align: center;

  &:hover {
    background-color: #00A070;
  }
`;

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <SplashContainer>
      <SplashLogo src="/src/pages/pnglogo copy.png" alt="Kabiraj AI Logo" />
      <SplashTitle>KABIRAJ AI</SplashTitle>
      <GetStartedButton onClick={handleGetStarted}>
        Get Started
      </GetStartedButton>
    </SplashContainer>
  );
};

export default SplashScreen; 