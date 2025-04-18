import React, { useContext, Fragment } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Navbar = () => {
  const authContext = useContext(AuthContext);
  const { isAuthenticated, logout, user } = authContext;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onLogout = () => {
    logout();
    handleClose();
  };

  const authLinks = (
    <Fragment>
      {isMobile ? (
        <div>
          <IconButton
            color="inherit"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleClick}
            edge="end"
          >
            {user && user.profileImage ? (
              <Avatar 
                src={user.profileImage}
                sx={{ width: 32, height: 32 }}
              />
            ) : (
              <MenuIcon />
            )}
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={open}
            onClose={handleClose}
          >
            {user && (
              <MenuItem disabled>
                <Typography variant="body2" color="textSecondary">
                  {user.name} ({user.role})
                </Typography>
              </MenuItem>
            )}
            <Divider />
            <MenuItem component={Link} to="/dashboard" onClick={handleClose}>
              Dashboard
            </MenuItem>
            <MenuItem component={Link} to="/courses" onClick={handleClose}>
              Courses
            </MenuItem>
            <MenuItem component={Link} to="/profile" onClick={handleClose}>
              Profile
            </MenuItem>
            <MenuItem onClick={onLogout}>Logout</MenuItem>
          </Menu>
        </div>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {user && (
            <Typography variant="body1" sx={{ mr: 2 }}>
              Hello, {user.name} ({user.role})
            </Typography>
          )}
          
          <Button
            component={Link}
            to="/dashboard"
            color="inherit"
            sx={{ mr: 2 }}
          >
            Dashboard
          </Button>
          <Button
            component={Link}
            to="/courses"
            color="inherit"
            sx={{ mr: 2 }}
          >
            Courses
          </Button>
          <Button
            component={Link}
            to="/profile"
            color="inherit"
            sx={{ mr: 2 }}
            startIcon={
              user && user.profileImage ? (
                <Avatar 
                  src={user.profileImage}
                  sx={{ width: 24, height: 24 }}
                />
              ) : (
                <AccountCircleIcon />
              )
            }
          >
            Profile
          </Button>
          <Button color="inherit" onClick={onLogout}>
            Logout
          </Button>
        </Box>
      )}
    </Fragment>
  );

  const guestLinks = (
    <Fragment>
      <Button component={Link} to="/register" color="inherit" sx={{ mr: 2 }}>
        Register
      </Button>
      <Button component={Link} to="/login" color="inherit">
        Login
      </Button>
    </Fragment>
  );

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Avatar
            alt="TeachAI"
            sx={{ mr: 1, width: 28, height: 28, bgcolor: 'secondary.main' }}
          >
            T
          </Avatar>
          TeachAI Assistant
        </Typography>
        {isAuthenticated ? authLinks : guestLinks}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 