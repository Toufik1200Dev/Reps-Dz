import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Badge,
  Container,
} from "@mui/material";
import { Menu as MenuIcon, ShoppingCart, Person } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import logo from "../../assets/logo/logo.png";
import { motion, AnimatePresence } from "framer-motion";
import AnnouncementBar from '../layout/AnnouncementBar';

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Programs", href: "/programs" },
  { label: "Calories", href: "/calorie-calculator" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { totalItems } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavClick = (href) => {
    navigate(href);
    handleMenuClose();
  };

  return (
    <>
      <AnnouncementBar />
      <AppBar
        position="sticky"
        elevation={0}
        className={`transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-md py-2" : "bg-transparent py-4"
          }`}
        sx={{
          backgroundColor: scrolled ? "rgba(255, 255, 255, 0.95)" : "transparent",
          color: scrolled ? "text.primary" : "text.primary",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.05)" : "none",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters className="flex justify-between items-center">
            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => handleNavClick("/")}
            >
              <div className={`relative overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-105 ${scrolled ? 'w-10 h-10' : 'w-12 h-12'}`}>
                <img src={logo} alt="REPS-DZ" className="w-full h-full object-cover" />
              </div>
              <Typography
                variant="h5"
                className={`font-display font-bold tracking-tight transition-colors duration-300 ${scrolled ? 'text-black' : 'text-black'}`}
                sx={{
                  fontSize: { xs: "1.25rem", md: "1.5rem" },
                  display: { xs: "none", sm: "block" },
                }}
              >
                REPS<span className="text-secondary">-DZ</span>
              </Typography>
            </div>

            {/* Desktop Navigation */}
            {!isMobile && (
              <nav className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-8">
                {navigationItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item.href)}
                    className="relative text-sm font-semibold uppercase tracking-wider text-gray-800 hover:text-black transition-colors duration-200 group py-2"
                  >
                    {item.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-hover:w-full"></span>
                  </button>
                ))}
              </nav>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Cart */}
              <IconButton
                onClick={() => handleNavClick("/cart")}
                className="relative group transition-transform hover:scale-105"
              >
                <Badge
                  badgeContent={totalItems}
                  sx={{
                    "& .MuiBadge-badge": {
                      background: "#FFD700",
                      color: "black",
                      fontWeight: "bold",
                    },
                  }}
                >
                  <ShoppingCart className="text-gray-800 group-hover:text-black transition-colors" />
                </Badge>
              </IconButton>

              {/* Desktop Shop Button */}
              {!isMobile && (
                <Button
                  variant="contained"
                  onClick={() => handleNavClick("/shop")}
                  className="bg-black hover:bg-gray-900 text-secondary font-bold px-6 py-2 rounded-full shadow-lg hover:shadow-gold transition-all duration-300 transform hover:-translate-y-0.5"
                  sx={{
                    background: "black",
                    color: "#FFD700",
                    "&:hover": { background: "#1a1a1a" }
                  }}
                >
                  Shop Now
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              {isMobile && (
                <IconButton
                  onClick={handleMenuOpen}
                  className="ml-2 text-black"
                >
                  <MenuIcon fontSize="medium" />
                </IconButton>
              )}

              {/* Mobile Menu Dropdown */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  elevation: 0,
                  className: "mt-2 rounded-xl shadow-xl border border-gray-100 min-w-[200px]"
                }}
              >
                {navigationItems.map((item) => (
                  <MenuItem
                    key={item.label}
                    onClick={() => handleNavClick(item.href)}
                    className="py-3 px-6 hover:bg-gray-50 font-medium"
                  >
                    {item.label}
                  </MenuItem>
                ))}
                <div className="p-4">
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleNavClick("/shop")}
                    className="bg-black text-secondary font-bold rounded-lg shadow-md"
                    sx={{
                      background: "black",
                      color: "#FFD700",
                      "&:hover": { background: "#1a1a1a" }
                    }}
                  >
                    Shop Now
                  </Button>
                </div>
              </Menu>
            </div>
          </Toolbar>
        </Container>
      </AppBar>
    </>
  );
}