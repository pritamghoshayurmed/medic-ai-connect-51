import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaUser, FaUserMd, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRole } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
  color: #333;
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
    color: #333;
    background-color: #fff;
    &::placeholder {
      color: rgba(0, 0, 0, 0.5);
    }
  }
`;

const PhoneInput = styled.div`
  display: flex;
  align-items: center;
`;

const CountryCode = styled.div`
  background-color: #f5f5f5;
  padding: 12px 15px;
  border-radius: 50px 0 0 50px;
  border: 1px solid #ddd;
  border-right: none;
  color: #333;
`;

const PhoneNumber = styled(Input)`
  border-radius: 0 50px 50px 0;
`;

const TogglePassword = styled.span`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #00C389;
  cursor: pointer;
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

const SignUp: React.FC = () => {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const dashboardPath = user.role === "doctor" ? "/doctor" : "/patient";
      navigate(dashboardPath);
    }
  }, [user, navigate]);

  const handleRoleSelect = (role: UserRole) => {
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
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Use the auth context's signup function
      await signup(
        formData.fullName,
        formData.email,
        formData.password,
        selectedRole,
        formData.phone
      );
      
      // Success message and navigation will be handled by the auth context
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Signup failed",
        description: error.message || "There was an error creating your account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Screen>
        <LogoContainer>
          <Logo src="/logo.png" alt="Kabiraj AI Logo" />
        </LogoContainer>
        <Title>Create Your Account</Title>
        <Subtitle>Join Kabiraj AI to manage your health</Subtitle>
        
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
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            
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
              <PhoneInput>
                <CountryCode>+91</CountryCode>
                <PhoneNumber
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </PhoneInput>
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
              <TogglePassword onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </TogglePassword>
            </FormGroup>
            
            <FormGroup>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              <TogglePassword onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </TogglePassword>
            </FormGroup>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#00C389] hover:bg-[#00A070] text-white border-none rounded-[50px] py-4 px-8 text-lg font-medium cursor-pointer transition-colors mt-5"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
        </FormContainer>
        
        <AuthLink>
          Already have an account? <a onClick={() => navigate('/login')}>Sign in</a>
        </AuthLink>
      </Screen>
    </Container>
  );
};

export default SignUp;
