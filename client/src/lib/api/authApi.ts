// Pseudo-code
import API from './axiosInstance';
import {
  LoginCredentials,
  NewPasswordCredentials,
  RegisterCredentials,
  VerifyEmailCredentials,
  VerifyOTPCredentials,
  SetRoleCredentials
} from '@/types/auth';

export const loginUser = async (credentials: LoginCredentials) => {
  const response = await API.post('/users/auth/login/', credentials);
  return response.data;
};
export const registerUser = async (credentials: RegisterCredentials) => {
  const response = await API.post('/users/auth/register/', credentials);
  return response.data;
};

export const setRole = async (credentials: SetRoleCredentials) => {
  const response = await API.post(`/users/auth/set-role/`,
    {
      role : credentials.role
    }, 
    {withCredentials : true}
  );
  return response.data;
};

export const VerifyEmail = async (credentials: VerifyEmailCredentials) => {
  const response = await API.post('/users/auth/email/', credentials);
  return response.data;
};

export const verifyOTP = async (credentials: VerifyOTPCredentials) => {
  const response = await API.post('/users/auth/otp-verify/', credentials);
  return response.data;
};
export const resetPassword = async (credentials: NewPasswordCredentials) => {
  const response = await API.post('/users/auth/new-password/', credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await API.get('/users/auth/me/');
  return response.data;
};

export const updateCurrentUserProfile = async (payload: Record<string, unknown>) => {
  const response = await API.patch('/users/auth/me/', payload, {
    withCredentials: true,
  });
  return response.data;
};

export const uploadProfileImage = async (file: File) => {
  const formData = new FormData();
  formData.append('profile_image', file);

  const response = await API.post('/users/auth/profile-image/', formData, {
    withCredentials: true,
  });
  return response.data;
};

export const uploadCoverImage = async (file: File) => {
  const formData = new FormData();
  formData.append('cover_image', file);

  const response = await API.post('/users/auth/cover-image/', formData, {
    withCredentials: true,
  });
  return response.data;
};

export const logoutUser = async () => {
  await API.post('/users/auth/logout/');
};

export const getTags = async () => {
  const response = await API.get('/users/tags/', {
    withCredentials: true,
  });
  return response.data;
};
