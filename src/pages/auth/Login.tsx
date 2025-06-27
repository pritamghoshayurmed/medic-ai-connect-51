import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaUser, FaUserMd, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRole } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EyeIcon, EyeOffIcon, TestTube } from "lucide-react";

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
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const RoleSelector = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const RoleOption = styled.div<{ selected: boolean }>`
  flex: 1;
  text-align: center;
  padding: 15px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid ${props => props.selected ? '#00C389' : 'transparent'};
  color: white;
  background-color: ${props => props.selected ? 'rgba(0, 195, 137, 0.2)' : 'transparent'};
  margin-right: ${props => props.role === 'patient' ? '10px' : '0'};

  i {
    font-size: 24px;
    margin-bottom: 8px;
    display: block;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  position: relative;
  
  input {
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.1);
    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
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

const TogglePassword = styled.span`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #00C389;
  cursor: pointer;
`;

const ForgotPassword = styled.div`
  text-align: right;
  margin-bottom: 15px;
  
  a {
    color: #00C389;
    text-decoration: none;
    font-size: 14px;
    cursor: pointer;
  }
`;

const Login: React.FC = () => {
  const { login, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    // Only redirect if auth is not loading and user is confirmed
    if (user && !authLoading) {
      // Ensure user.role is available before navigating
      if (user.role) {
        toast({
          title: "Already logged in",
          description: "Redirecting to your dashboard...",
        });

        const dashboardPath = user.role === "doctor" ? "/doctor" : "/patient";
        navigate(dashboardPath);
      } else {
        // This case might happen if user is set but role is not yet populated
        // (e.g. preliminary user object). Avoid redirecting.
        console.log("Login page: User object exists but role is not yet defined. Waiting for role.");
      }
    }
  }, [user, authLoading, navigate, toast]);

  const handleRoleSelect = (role: 'patient' | 'doctor') => {
    setSelectedRole(role);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Use the auth context's login function
      await login(formData.email, formData.password, selectedRole);
      
      // Toast message will be handled by the auth context
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container>
      <Screen>
        <LogoContainer>
          <Logo src="/logo.png" alt="Kabiraj AI Logo" />
        </LogoContainer>
        <Title>Welcome to<br/>Kabiraj AI</Title>
        <Subtitle>Sign in to continue</Subtitle>
        
        <FormContainer>
          <form onSubmit={handleSubmit}>
            <RoleSelector>
              <RoleOption 
                selected={selectedRole === 'patient'} 
                onClick={() => handleRoleSelect('patient')}
                role="patient"
              >
                <FaUser size={24} style={{ marginBottom: '8px' }} />
                <span>Patient</span>
              </RoleOption>
              <RoleOption 
                selected={selectedRole === 'doctor'} 
                onClick={() => handleRoleSelect('doctor')}
                role="doctor"
              >
                <FaUserMd size={24} style={{ marginBottom: '8px' }} />
                <span>Doctor</span>
              </RoleOption>
            </RoleSelector>
            
            <FormGroup>
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <TogglePassword onClick={togglePasswordVisibility}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </TogglePassword>
            </FormGroup>
            
            <ForgotPassword>
              <a onClick={() => navigate('/forgot-password')}>Forgot Password?</a>
            </ForgotPassword>
            
            <Button type="submit">Login</Button>
          </form>
        </FormContainer>
        
        <AuthLink>
          Don't have an account? <a onClick={() => navigate('/signup')}>Sign Up</a>
        </AuthLink>
      </Screen>
    </Container>
  );
};

export default Login;
