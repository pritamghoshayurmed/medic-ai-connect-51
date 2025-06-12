import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Screen = styled.div`
  width: 100%;
  max-width: 375px;
  height: 100%;
  max-height: 812px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  position: relative;
  overflow-y: auto;
`;

const Container = styled.div`
  background: linear-gradient(135deg, #004953 0%, #006064 50%, #00363a 100%);
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Roboto', sans-serif;
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
  margin-bottom: 20px;
`;

const Logo = styled.img`
  width: 80px;
  height: auto;
  margin-bottom: 10px;
`;

const Title = styled.h2`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 30px;
  text-align: center;
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 350px;
  background-color: white;
  border-radius: 20px;
  padding: 30px 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  position: relative;
`;

const Label = styled.label`
  display: block;
  color: #333;
  margin-bottom: 5px;
  font-size: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 50px;
  font-size: 16px;
  color: #333;
`;

const Button = styled.button`
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
  margin-top: 20px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #00A070;
  }
`;

const AuthLink = styled.p`
  margin-top: 20px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  
  a {
    color: #00C389;
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
  }
`;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert('Password reset link sent to your email!');
      navigate('/login');
    } else {
      alert('Please enter your email address');
    }
  };

  return (
    <Container>
      <Screen>
        <LogoContainer>
          <Logo src="/src/pages/pnglogo copy.png" alt="Kabiraj AI Logo" />
        </LogoContainer>
        <Title>Forgot Password</Title>
        <Subtitle>Enter your email to reset your password</Subtitle>
        
        <FormContainer>
          <form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="reset-email">Email</Label>
              <Input
                type="email"
                id="reset-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormGroup>
            <Button type="submit">Send Reset Link</Button>
          </form>
        </FormContainer>
        
        <AuthLink>
          <a onClick={() => navigate('/login')}>Back to Sign In</a>
        </AuthLink>
      </Screen>
    </Container>
  );
};

export default ForgotPassword; 