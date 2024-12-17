import React from 'react';
import { useForm } from 'react-hook-form';
import { TextField, Button, Grid, Typography, Box, Alert, CircularProgress } from '@mui/material';

const AuthForm = ({ isRegister, onSubmit, loading, error, toggleForm }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  // Handle form submission
  const onFormSubmit = (data) => {
    console.log('Form Data:', data);
    onSubmit(data); // Pass form data to parent handler
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        margin: '0 auto',
        padding: 3,
        border: '1px solid #ccc',
        borderRadius: 2,
        backgroundColor: '#fafafa',
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        {isRegister ? 'Register' : 'Login'}
      </Typography>

      {/* Display general error from parent */}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Display form-specific errors */}
      {errors.email && <Alert severity="error">{errors.email.message}</Alert>}
      {errors.password && <Alert severity="error">{errors.password.message}</Alert>}
      {isRegister && errors.confirmPassword && (
        <Alert severity="error">{errors.confirmPassword.message}</Alert>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Emaidfsddl"
              type="email"
              variant="outlined"
              {...register('email', { required: 'Email is required' })}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />
          </Grid>

          {!isRegister && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                {...register('password', { required: 'Password is required' })}
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />
            </Grid>
          )}

          {isRegister && (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  variant="outlined"
                  {...register('password', { required: 'Password is required' })}
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  variant="outlined"
                  {...register('confirmPassword', {
                    required: 'Confirm your password',
                    validate: (value) =>
                      value === watch('password') || 'Passwords do not match',
                  })}
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword?.message}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              sx={{ marginTop: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : isRegister ? 'Register' : 'Login'}
            </Button>
          </Grid>
        </Grid>
      </form>

      <Box sx={{ textAlign: 'center', marginTop: 2 }}>
        <Typography variant="body2">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <Button onClick={toggleForm}>
                Login
              </Button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <Button onClick={toggleForm}>
                Register
              </Button>
            </>
          )}
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthForm;
